import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
  pgEnum,
  serial,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────
export const unitEnum = pgEnum("unit", ["kg", "lb"]);
export const visibilityEnum = pgEnum("visibility", ["public", "hidden"]);

// ── profiles ──────────────────────────────────────────────────────────
// id matches auth.users.id (Supabase). Big-4 PRs are denormalized here so the
// leaderboard is a single-table query. All weights stored in KILOGRAMS.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  username: text("username").notNull().unique(),
  country: text("country").notNull().default("Unknown"),
  city: text("city"),
  preferredUnit: unitEnum("preferred_unit").notNull().default("kg"),
  visibility: visibilityEnum("visibility").notNull().default("hidden"),
  squatKg: real("squat_kg"),
  benchKg: real("bench_kg"),
  ohpKg: real("ohp_kg"),
  deadliftKg: real("deadlift_kg"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── exercises (seeded library) ────────────────────────────────────────
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  muscleGroup: text("muscle_group").notNull(),
});

// ── split_entries (an exercise placed on a weekday) ───────────────────
export const splitEntries = pgTable("split_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0 = Mon … 6 = Sun
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
});

// ── sets (logged under a split entry) ─────────────────────────────────
export const sets = pgTable("sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  splitEntryId: uuid("split_entry_id")
    .notNull()
    .references(() => splitEntries.id, { onDelete: "cascade" }),
  setIndex: integer("set_index").notNull(),
  reps: integer("reps").notNull(),
  weightKg: real("weight_kg").notNull(), // always kilograms
});

// ── friendships (~ nice-to-have) ──────────────────────────────────────
export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  addresseeId: uuid("addressee_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending | accepted
});

export type Profile = typeof profiles.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
