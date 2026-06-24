"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { displayToKg, type Unit } from "@/lib/units";

const GENDER_VALUES = ["male", "female", "other", "undisclosed"];

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

function parseLift(formData: FormData, field: string, unit: Unit): number | null {
  const raw = formData.get(field);
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return displayToKg(n, unit); // store kg — the invariant lives here
}

export type SaveResult = { error?: string };

export async function updateProfile(formData: FormData): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [current] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!current) return { error: "Profile not found" };

  // ── Username (editable, must stay unique) ──
  const rawUsername = String(formData.get("username") ?? "").trim().toLowerCase();
  const username = rawUsername.replace(/[^a-z0-9_]/g, "");
  if (username.length < 3) return { error: "Username must be 3+ characters." };
  if (username.length > 20) return { error: "Username must be 20 characters or fewer." };

  if (username !== current.username) {
    const clash = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.username, username), ne(profiles.id, user.id)))
      .limit(1);
    if (clash.length) return { error: "That username is taken." };

    // For password users (synthetic @setsync.local email) keep the login email
    // in sync so they can still sign in with the new username. Leave Google
    // accounts' real emails untouched.
    if (user.email?.endsWith("@setsync.local")) {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(user.id, {
        email: `${username}@setsync.local`,
        user_metadata: { ...user.user_metadata, username },
      });
    }
  }

  // ── Avatar upload (optional) ──
  let avatarUrl: string | undefined;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2_000_000) return { error: "Image must be under 2 MB." };
    const admin = createAdminClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return { error: `Image upload failed: ${upErr.message}` };
    const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
    avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;
  }

  // ── Other fields ──
  const unit = (String(formData.get("preferredUnit")) === "lb" ? "lb" : "kg") as Unit;
  const country = String(formData.get("country") ?? "Other");
  const city = String(formData.get("city") ?? "").trim() || null;
  const fullName = String(formData.get("fullName") ?? "").trim() || null;
  const genderRaw = String(formData.get("gender") ?? "");
  const gender = GENDER_VALUES.includes(genderRaw) ? genderRaw : null;
  const dobRaw = String(formData.get("dob") ?? "").trim();
  const dob =
    dobRaw && !Number.isNaN(new Date(dobRaw).getTime()) ? dobRaw : null;
  const visibility =
    String(formData.get("visibility")) === "public" ? "public" : "hidden";

  await db
    .update(profiles)
    .set({
      username,
      fullName,
      gender,
      dob,
      ...(avatarUrl ? { avatarUrl } : {}),
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
  return {};
}
