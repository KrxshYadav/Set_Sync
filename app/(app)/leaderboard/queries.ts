import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { LiftKey } from "@/lib/constants";

const COLS = {
  squat: profiles.squatKg,
  bench: profiles.benchKg,
  ohp: profiles.ohpKg,
  deadlift: profiles.deadliftKg,
} as const;

export type LeaderRow = {
  id: string;
  username: string;
  country: string;
  city: string | null;
  weightKg: number;
  rank: number;
};

/**
 * Ranked leaderboard for one lift. Pass a country to scope it, omit for
 * worldwide. Hidden profiles still appear here — visibility only gates the
 * profile page, not the ranking.
 */
export async function getLeaderboard(
  lift: LiftKey,
  country?: string,
): Promise<LeaderRow[]> {
  const col = COLS[lift];
  const where = country
    ? and(isNotNull(col), eq(profiles.country, country))
    : isNotNull(col);

  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      country: profiles.country,
      city: profiles.city,
      weightKg: col,
    })
    .from(profiles)
    .where(where)
    .orderBy(desc(col), asc(profiles.createdAt))
    .limit(100);

  return rows.map((r, i) => ({
    ...r,
    weightKg: r.weightKg as number,
    rank: i + 1,
  }));
}
