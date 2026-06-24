import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, type Profile } from "@/lib/db/schema";
import { LIFTS, type LiftKey } from "@/lib/constants";

const COLS = {
  squat: profiles.squatKg,
  bench: profiles.benchKg,
  ohp: profiles.ohpKg,
  deadlift: profiles.deadliftKg,
} as const;

const FIELD: Record<LiftKey, keyof Profile> = {
  squat: "squatKg",
  bench: "benchKg",
  ohp: "ohpKg",
  deadlift: "deadliftKg",
};

export type Standing = {
  key: LiftKey;
  label: string;
  weightKg: number;
  worldRank: number;
  worldTotal: number;
  countryRank: number;
  countryTotal: number;
};

/** Rank the user for each lift they've recorded, worldwide and in their country. */
export async function getStandings(profile: Profile): Promise<Standing[]> {
  const out: Standing[] = [];

  for (const lift of LIFTS) {
    const myVal = profile[FIELD[lift.key]] as number | null;
    if (myVal == null) continue;
    const col = COLS[lift.key];

    const [world] = await db
      .select({
        total: sql<number>`count(*) filter (where ${col} is not null)::int`,
        better: sql<number>`count(*) filter (where ${col} > ${myVal})::int`,
      })
      .from(profiles);

    const [country] = await db
      .select({
        total: sql<number>`count(*) filter (where ${col} is not null)::int`,
        better: sql<number>`count(*) filter (where ${col} > ${myVal})::int`,
      })
      .from(profiles)
      .where(eq(profiles.country, profile.country));

    out.push({
      key: lift.key,
      label: lift.label,
      weightKg: myVal,
      worldRank: world.better + 1,
      worldTotal: world.total,
      countryRank: country.better + 1,
      countryTotal: country.total,
    });
  }

  return out;
}
