"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { addExercise } from "@/app/(app)/split/actions";
import type { Exercise } from "@/lib/db/schema";
import { toast } from "sonner";

export function ExercisePicker({
  weekday,
  library,
}: {
  weekday: number;
  library: Exercise[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const filtered = library.filter((e) =>
      e.name.toLowerCase().includes(q.toLowerCase().trim()),
    );
    const map = new Map<string, Exercise[]>();
    for (const e of filtered) {
      if (!map.has(e.muscleGroup)) map.set(e.muscleGroup, []);
      map.get(e.muscleGroup)!.push(e);
    }
    return [...map.entries()];
  }, [library, q]);

  function add(id: number, name: string) {
    startTransition(async () => {
      await addExercise(weekday, id);
      toast.success(`Added ${name}`);
      setOpen(false);
      setQ("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="w-full" />}>
        <Plus className="size-4" /> Add exercise
      </DialogTrigger>
      <DialogContent className="max-h-[80dvh] overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Add an exercise</DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-2">
          <Input
            autoFocus
            placeholder="Search exercises…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="max-h-[55dvh] overflow-y-auto px-4 pb-4">
          {grouped.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No exercises match “{q}”.
            </p>
          )}
          {grouped.map(([muscle, items]) => (
            <div key={muscle} className="mb-4">
              <p className="sticky top-0 bg-background py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {muscle}
              </p>
              <div className="space-y-1">
                {items.map((e) => (
                  <button
                    key={e.id}
                    disabled={pending}
                    onClick={() => add(e.id, e.name)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-secondary disabled:opacity-50"
                  >
                    {e.name}
                    <Plus className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
