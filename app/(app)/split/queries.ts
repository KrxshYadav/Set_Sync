import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, sets, splitEntries } from "@/lib/db/schema";

export type DaySet = {
  id: string;
  setIndex: number;
  reps: number;
  weightKg: number;
};

export type DayEntry = {
  id: string;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  position: number;
  sets: DaySet[];
};

export async function getDayEntries(
  userId: string,
  weekday: number,
): Promise<DayEntry[]> {
  const entries = await db
    .select({
      id: splitEntries.id,
      exerciseId: splitEntries.exerciseId,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
      position: splitEntries.position,
    })
    .from(splitEntries)
    .innerJoin(exercises, eq(splitEntries.exerciseId, exercises.id))
    .where(and(eq(splitEntries.userId, userId), eq(splitEntries.weekday, weekday)))
    .orderBy(asc(splitEntries.position));

  if (entries.length === 0) return [];

  const entryIds = entries.map((e) => e.id);
  const allSets = await db
    .select()
    .from(sets)
    .where(inArray(sets.splitEntryId, entryIds))
    .orderBy(asc(sets.setIndex));

  return entries.map((e) => ({
    ...e,
    sets: allSets
      .filter((s) => s.splitEntryId === e.id)
      .map((s) => ({
        id: s.id,
        setIndex: s.setIndex,
        reps: s.reps,
        weightKg: s.weightKg,
      })),
  }));
}

export async function getExerciseLibrary() {
  return db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.muscleGroup), asc(exercises.name));
}
