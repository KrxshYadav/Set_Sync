"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sets, splitEntries } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { displayToKg, type Unit } from "@/lib/units";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function addExercise(weekday: number, exerciseId: number) {
  const userId = await requireUserId();
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${splitEntries.position}), -1)` })
    .from(splitEntries)
    .where(and(eq(splitEntries.userId, userId), eq(splitEntries.weekday, weekday)));

  await db.insert(splitEntries).values({
    userId,
    weekday,
    exerciseId,
    position: (max ?? -1) + 1,
  });
  revalidatePath("/split");
}

export async function removeEntry(entryId: string) {
  const userId = await requireUserId();
  await db
    .delete(splitEntries)
    .where(and(eq(splitEntries.id, entryId), eq(splitEntries.userId, userId)));
  revalidatePath("/split");
}

export async function addSet(entryId: string) {
  await requireUserId();
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${sets.setIndex}), 0)` })
    .from(sets)
    .where(eq(sets.splitEntryId, entryId));

  await db.insert(sets).values({
    splitEntryId: entryId,
    setIndex: (max ?? 0) + 1,
    reps: 8,
    weightKg: 0,
  });
  revalidatePath("/split");
}

// Update a set in place (overwrite — no dated history). Weight comes in the
// user's display unit and is converted to kg here.
export async function updateSet(
  setId: string,
  reps: number,
  weightDisplay: number,
  unit: Unit,
) {
  await requireUserId();
  await db
    .update(sets)
    .set({
      reps: Math.max(0, Math.round(reps)),
      weightKg: displayToKg(Math.max(0, weightDisplay), unit),
    })
    .where(eq(sets.id, setId));
  revalidatePath("/split");
}

export async function removeSet(setId: string) {
  await requireUserId();
  await db.delete(sets).where(eq(sets.id, setId));
  revalidatePath("/split");
}

// ── Today's session ───────────────────────────────────────────────────

/** Tick / untick a single set during a live workout. */
export async function toggleSetDone(setId: string, done: boolean) {
  await requireUserId();
  await db.update(sets).set({ done }).where(eq(sets.id, setId));
  revalidatePath("/split");
}

/** Finish the session: clear all ticks for the given weekday's sets. */
export async function finishWorkout(weekday: number) {
  const userId = await requireUserId();
  const entries = await db
    .select({ id: splitEntries.id })
    .from(splitEntries)
    .where(and(eq(splitEntries.userId, userId), eq(splitEntries.weekday, weekday)));
  const ids = entries.map((e) => e.id);
  if (ids.length) {
    await db
      .update(sets)
      .set({ done: false })
      .where(inArray(sets.splitEntryId, ids));
  }
  revalidatePath("/split");
}
