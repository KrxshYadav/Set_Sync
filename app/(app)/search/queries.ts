import { ilike, ne, and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, splitEntries, exercises } from "@/lib/db/schema";

export async function searchUsers(q: string, excludeId?: string) {
  const term = q.trim();
  if (term.length < 1) return [];
  const where = excludeId
    ? and(ilike(profiles.username, `%${term}%`), ne(profiles.id, excludeId))
    : ilike(profiles.username, `%${term}%`);
  return db
    .select({
      id: profiles.id,
      username: profiles.username,
      country: profiles.country,
      visibility: profiles.visibility,
    })
    .from(profiles)
    .where(where)
    .orderBy(asc(profiles.username))
    .limit(25);
}

export async function getProfileByUsername(username: string) {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);
  return row ?? null;
}

/** Exercises grouped by weekday for a public profile view (names only). */
export async function getSplitOverview(userId: string) {
  const rows = await db
    .select({
      weekday: splitEntries.weekday,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      position: splitEntries.position,
    })
    .from(splitEntries)
    .innerJoin(exercises, eq(splitEntries.exerciseId, exercises.id))
    .where(eq(splitEntries.userId, userId))
    .orderBy(asc(splitEntries.weekday), asc(splitEntries.position));

  const byDay = new Map<number, { name: string; muscleGroup: string }[]>();
  for (const r of rows) {
    if (!byDay.has(r.weekday)) byDay.set(r.weekday, []);
    byDay.get(r.weekday)!.push({ name: r.name, muscleGroup: r.muscleGroup });
  }
  return byDay;
}
