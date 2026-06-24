"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Check, Flag, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatWeight, type Unit } from "@/lib/units";
import { toggleSetDone, finishWorkout } from "@/app/(app)/split/actions";
import type { DayEntry } from "@/app/(app)/split/queries";
import { toast } from "sonner";

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function TodaySession({
  weekday,
  entries,
  unit,
  dateKey,
}: {
  weekday: number;
  entries: DayEntry[];
  unit: Unit;
  dateKey: string;
}) {
  const storageKey = `setsync_start_${dateKey}`;
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [, startTx] = useTransition();

  // Local tick state for snappy toggles, seeded from the server.
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const e of entries) for (const s of e.sets) m[s.id] = s.done;
    return m;
  });

  // Restore an in-progress session from localStorage after mount.
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setStartedAt(Number(saved));
  }, [storageKey]);

  // Tick the clock once a second while running.
  useEffect(() => {
    if (!startedAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const totalSets = entries.reduce((n, e) => n + e.sets.length, 0);
  const doneCount = Object.values(done).filter(Boolean).length;

  function start() {
    const t = Date.now();
    setStartedAt(t);
    localStorage.setItem(storageKey, String(t));
  }

  function toggle(setId: string) {
    const next = !done[setId];
    setDone((d) => ({ ...d, [setId]: next }));
    startTx(() => toggleSetDone(setId, next));
  }

  function finish() {
    startTx(async () => {
      await finishWorkout(weekday);
      setDone({});
      setStartedAt(null);
      localStorage.removeItem(storageKey);
      toast.success("Workout complete. Nice work 💪");
    });
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
        Nothing planned for today. Switch to <strong>Plan</strong> to add
        exercises to this day.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timer / start bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        {startedAt ? (
          <>
            <div className="flex items-center gap-2">
              <Timer className="size-5 text-lime-500" />
              <span className="text-2xl font-semibold tabular-nums">
                {fmt(now - startedAt)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {doneCount}/{totalSets} sets
              </span>
              <Button variant="outline" size="sm" onClick={finish}>
                <Flag className="size-4" /> Finish
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="font-medium">Ready to train?</p>
              <p className="text-sm text-muted-foreground">
                {entries.length} exercises · {totalSets} sets
              </p>
            </div>
            <Button onClick={start}>
              <Play className="size-4" /> Start workout
            </Button>
          </>
        )}
      </div>

      {/* Progress bar */}
      {startedAt && totalSets > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-lime-500 transition-all"
            style={{ width: `${(doneCount / totalSets) * 100}%` }}
          />
        </div>
      )}

      {/* Exercises */}
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{entry.exerciseName}</h3>
            <Badge variant="secondary">{entry.muscleGroup}</Badge>
          </div>

          {entry.sets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sets planned.</p>
          ) : (
            <div className="space-y-2">
              {entry.sets.map((s, i) => {
                const isDone = done[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      isDone
                        ? "border-lime-500/40 bg-lime-500/10"
                        : "hover:bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isDone
                          ? "border-lime-500 bg-lime-500 text-white"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {isDone && <Check className="size-4" strokeWidth={3} />}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Set {i + 1}
                    </span>
                    <span
                      className={cn(
                        "ml-auto text-sm font-medium tabular-nums",
                        isDone && "text-muted-foreground line-through",
                      )}
                    >
                      {s.reps} × {formatWeight(s.weightKg, unit)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
