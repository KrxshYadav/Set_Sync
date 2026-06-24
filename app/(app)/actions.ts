"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { displayToKg, type Unit } from "@/lib/units";

/** Create a profiles row for a freshly-authed user if one doesn't exist. */
export async function ensureProfile(user: User) {
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (existing.length) return existing[0];

  const rawBase =
    (user.user_metadata?.username as string | undefined) ??
    user.email?.split("@")[0] ??
    "lifter";
  const base =
    rawBase.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) || "lifter";

  let username = base;
  for (let i = 0; i < 6; i++) {
    const clash = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.username, username))
      .limit(1);
    if (!clash.length) break;
    username = `${base}${Math.floor(Math.random() * 10000)}`;
  }

  const [row] = await db
    .insert(profiles)
    .values({ id: user.id, username })
    .onConflictDoNothing()
    .returning();

  if (row) return row;
  // Lost a race — re-read.
  const reread = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  return reread[0];
}

export async function getMyProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return ensureProfile(user);
}

function parseLift(formData: FormData, field: string, unit: Unit): number | null {
  const raw = formData.get(field);
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return displayToKg(n, unit); // store kg — the invariant lives here
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const unit = (String(formData.get("preferredUnit")) === "lb" ? "lb" : "kg") as Unit;
  const country = String(formData.get("country") ?? "Other");
  const city = String(formData.get("city") ?? "").trim() || null;
  const visibility =
    String(formData.get("visibility")) === "public" ? "public" : "hidden";

  await db
    .update(profiles)
    .set({
      country,
      city,
      preferredUnit: unit,
      visibility,
      // PRs are entered in the user's chosen unit -> converted to kg above.
      squatKg: parseLift(formData, "squat", unit),
      benchKg: parseLift(formData, "bench", unit),
      ohpKg: parseLift(formData, "ohp", unit),
      deadliftKg: parseLift(formData, "deadlift", unit),
    })
    .where(eq(profiles.id, user.id));

  revalidatePath("/", "layout");
}
