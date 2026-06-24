"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, X } from "lucide-react";
import { ExercisePicker } from "@/components/exercise-picker";
import {
  addSet,
  removeEntry,
  removeSet,
  updateSet,
} from "@/app/(app)/split/actions";
import type { DayEntry } from "@/app/(app)/split/queries";
import type { Exercise } from "@/lib/db/schema";
import { kgToDisplay, type Unit } from "@/lib/units";

export function SplitDay({
  weekday,
  entries,
  library,
  unit,
}: {
  weekday: number;
  entries: DayEntry[];
  library: Exercise[];
  unit: Unit;
}) {
  return (
    <div className="space-y-4">
      {entries.length === 0 && (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Rest day? Or add your first exercise below.
        </div>
      )}

      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} unit={unit} />
      ))}

      <ExercisePicker weekday={weekday} library={library} />
    </div>
  );
}

function EntryCard({ entry, unit }: { entry: DayEntry; unit: Unit }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{entry.exerciseName}</h3>
          <Badge variant="secondary" className="mt-1">
            {entry.muscleGroup}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          disabled={pending}
          onClick={() => startTransition(() => removeEntry(entry.id))}
          aria-label="Remove exercise"
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>

      {entry.sets.length > 0 && (
        <div className="mb-2 grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Set</span>
          <span>Reps</span>
          <span>Weight ({unit})</span>
          <span />
        </div>
      )}

      <div className="space-y-2">
        {entry.sets.map((s, i) => (
          <SetRow key={s.id} set={s} index={i + 1} unit={unit} />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-2"
        disabled={pending}
        onClick={() => startTransition(() => addSet(entry.id))}
      >
        <Plus className="size-4" /> Add set
      </Button>
    </div>
  );
}

function SetRow({
  set,
  index,
  unit,
}: {
  set: { id: string; reps: number; weightKg: number };
  index: number;
  unit: Unit;
}) {
  const [reps, setReps] = useState(String(set.reps));
  const [weight, setWeight] = useState(
    String(kgToDisplay(set.weightKg, unit) ?? 0),
  );
  const [, startTransition] = useTransition();

  function save() {
    startTransition(() =>
      updateSet(set.id, Number(reps) || 0, Number(weight) || 0, unit),
    );
  }

  return (
    <div className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">{index}</span>
      <Input
        type="number"
        min="0"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={save}
        className="h-9"
      />
      <Input
        type="number"
        min="0"
        step="0.5"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={save}
        className="h-9"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => startTransition(() => removeSet(set.id))}
        aria-label="Remove set"
      >
        <X className="size-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
