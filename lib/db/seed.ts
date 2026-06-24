import "../load-env";
import { sql } from "drizzle-orm";
import { db } from "./index";
import { exercises, profiles } from "./schema";
import { randomUUID } from "node:crypto";

// ── Exercise library ──────────────────────────────────────────────────
// Broad coverage across equipment: barbell, dumbbell, machine, cable, smith
// machine, kettlebell and bodyweight.
const EXERCISES: { name: string; muscleGroup: string }[] = [
  // ── Chest ──
  { name: "Barbell Bench Press", muscleGroup: "Chest" },
  { name: "Incline Barbell Bench Press", muscleGroup: "Chest" },
  { name: "Decline Barbell Bench Press", muscleGroup: "Chest" },
  { name: "Dumbbell Bench Press", muscleGroup: "Chest" },
  { name: "Incline Dumbbell Press", muscleGroup: "Chest" },
  { name: "Smith Machine Bench Press", muscleGroup: "Chest" },
  { name: "Machine Chest Press", muscleGroup: "Chest" },
  { name: "Pec Deck Machine", muscleGroup: "Chest" },
  { name: "Cable Crossover", muscleGroup: "Chest" },
  { name: "Cable Fly", muscleGroup: "Chest" },
  { name: "Dumbbell Fly", muscleGroup: "Chest" },
  { name: "Push Up", muscleGroup: "Chest" },
  { name: "Dips", muscleGroup: "Chest" },

  // ── Back ──
  { name: "Deadlift", muscleGroup: "Back" },
  { name: "Barbell Row", muscleGroup: "Back" },
  { name: "Pendlay Row", muscleGroup: "Back" },
  { name: "T-Bar Row", muscleGroup: "Back" },
  { name: "Dumbbell Row", muscleGroup: "Back" },
  { name: "Seated Cable Row", muscleGroup: "Back" },
  { name: "Lat Pulldown", muscleGroup: "Back" },
  { name: "Wide-Grip Lat Pulldown", muscleGroup: "Back" },
  { name: "Straight-Arm Cable Pulldown", muscleGroup: "Back" },
  { name: "Machine Row", muscleGroup: "Back" },
  { name: "Smith Machine Row", muscleGroup: "Back" },
  { name: "Pull Up", muscleGroup: "Back" },
  { name: "Chin Up", muscleGroup: "Back" },
  { name: "Rack Pull", muscleGroup: "Back" },

  // ── Legs ──
  { name: "Back Squat", muscleGroup: "Legs" },
  { name: "Front Squat", muscleGroup: "Legs" },
  { name: "Smith Machine Squat", muscleGroup: "Legs" },
  { name: "Hack Squat", muscleGroup: "Legs" },
  { name: "Leg Press", muscleGroup: "Legs" },
  { name: "Bulgarian Split Squat", muscleGroup: "Legs" },
  { name: "Walking Lunge", muscleGroup: "Legs" },
  { name: "Goblet Squat", muscleGroup: "Legs" },
  { name: "Romanian Deadlift", muscleGroup: "Legs" },
  { name: "Dumbbell Romanian Deadlift", muscleGroup: "Legs" },
  { name: "Leg Curl", muscleGroup: "Legs" },
  { name: "Seated Leg Curl", muscleGroup: "Legs" },
  { name: "Leg Extension", muscleGroup: "Legs" },
  { name: "Standing Calf Raise", muscleGroup: "Legs" },
  { name: "Seated Calf Raise", muscleGroup: "Legs" },
  { name: "Hip Thrust", muscleGroup: "Legs" },
  { name: "Cable Pull Through", muscleGroup: "Legs" },

  // ── Shoulders ──
  { name: "Overhead Barbell Press", muscleGroup: "Shoulders" },
  { name: "Seated Dumbbell Shoulder Press", muscleGroup: "Shoulders" },
  { name: "Arnold Press", muscleGroup: "Shoulders" },
  { name: "Smith Machine Shoulder Press", muscleGroup: "Shoulders" },
  { name: "Machine Shoulder Press", muscleGroup: "Shoulders" },
  { name: "Dumbbell Lateral Raise", muscleGroup: "Shoulders" },
  { name: "Cable Lateral Raise", muscleGroup: "Shoulders" },
  { name: "Machine Lateral Raise", muscleGroup: "Shoulders" },
  { name: "Rear Delt Fly", muscleGroup: "Shoulders" },
  { name: "Reverse Pec Deck", muscleGroup: "Shoulders" },
  { name: "Face Pull", muscleGroup: "Shoulders" },
  { name: "Barbell Shrug", muscleGroup: "Shoulders" },
  { name: "Dumbbell Shrug", muscleGroup: "Shoulders" },

  // ── Arms ──
  { name: "Barbell Curl", muscleGroup: "Arms" },
  { name: "EZ-Bar Curl", muscleGroup: "Arms" },
  { name: "Dumbbell Curl", muscleGroup: "Arms" },
  { name: "Hammer Curl", muscleGroup: "Arms" },
  { name: "Incline Dumbbell Curl", muscleGroup: "Arms" },
  { name: "Preacher Curl", muscleGroup: "Arms" },
  { name: "Cable Curl", muscleGroup: "Arms" },
  { name: "Concentration Curl", muscleGroup: "Arms" },
  { name: "Tricep Pushdown", muscleGroup: "Arms" },
  { name: "Rope Pushdown", muscleGroup: "Arms" },
  { name: "Overhead Cable Extension", muscleGroup: "Arms" },
  { name: "Skull Crusher", muscleGroup: "Arms" },
  { name: "Dumbbell Overhead Extension", muscleGroup: "Arms" },
  { name: "Close-Grip Bench Press", muscleGroup: "Arms" },
  { name: "Bench Dips", muscleGroup: "Arms" },

  // ── Core ──
  { name: "Plank", muscleGroup: "Core" },
  { name: "Hanging Leg Raise", muscleGroup: "Core" },
  { name: "Cable Crunch", muscleGroup: "Core" },
  { name: "Russian Twist", muscleGroup: "Core" },
  { name: "Ab Wheel Rollout", muscleGroup: "Core" },
  { name: "Decline Sit Up", muscleGroup: "Core" },
  { name: "Mountain Climbers", muscleGroup: "Core" },
];

// ── Fake leaderboard users ────────────────────────────────────────────
type Seed = {
  username: string;
  country: string;
  city: string;
  unit: "kg" | "lb";
  visibility: "public" | "hidden";
  squat: number;
  bench: number;
  ohp: number;
  deadlift: number; // all in kg
};

const FAKE: Seed[] = [
  { username: "rohan_lifts", country: "India", city: "Mumbai", unit: "kg", visibility: "public", squat: 180, bench: 120, ohp: 70, deadlift: 220 },
  { username: "priya_pr", country: "India", city: "Delhi", unit: "kg", visibility: "public", squat: 130, bench: 80, ohp: 50, deadlift: 160 },
  { username: "arjun_beast", country: "India", city: "Bengaluru", unit: "kg", visibility: "hidden", squat: 210, bench: 145, ohp: 85, deadlift: 260 },
  { username: "neha_strong", country: "India", city: "Pune", unit: "kg", visibility: "public", squat: 110, bench: 65, ohp: 42, deadlift: 140 },
  { username: "vikram_iron", country: "India", city: "Chennai", unit: "kg", visibility: "public", squat: 165, bench: 110, ohp: 65, deadlift: 205 },
  { username: "ananya_gym", country: "India", city: "Hyderabad", unit: "kg", visibility: "public", squat: 95, bench: 55, ohp: 38, deadlift: 125 },
  { username: "mike_d", country: "United States", city: "Austin", unit: "lb", visibility: "public", squat: 200, bench: 140, ohp: 80, deadlift: 250 },
  { username: "jenna_squats", country: "United States", city: "Denver", unit: "lb", visibility: "public", squat: 145, bench: 85, ohp: 52, deadlift: 180 },
  { username: "tyler_t", country: "United States", city: "Miami", unit: "lb", visibility: "hidden", squat: 230, bench: 160, ohp: 95, deadlift: 285 },
  { username: "sara_k", country: "United States", city: "Seattle", unit: "lb", visibility: "public", squat: 120, bench: 70, ohp: 45, deadlift: 155 },
  { username: "dave_uk", country: "United Kingdom", city: "London", unit: "kg", visibility: "public", squat: 175, bench: 125, ohp: 72, deadlift: 215 },
  { username: "emma_l", country: "United Kingdom", city: "Manchester", unit: "kg", visibility: "public", squat: 105, bench: 60, ohp: 40, deadlift: 135 },
  { username: "oli_strong", country: "United Kingdom", city: "Leeds", unit: "kg", visibility: "hidden", squat: 195, bench: 135, ohp: 80, deadlift: 240 },
  { username: "lukas_b", country: "Germany", city: "Berlin", unit: "kg", visibility: "public", squat: 188, bench: 128, ohp: 76, deadlift: 225 },
  { username: "mia_h", country: "Germany", city: "Munich", unit: "kg", visibility: "public", squat: 118, bench: 68, ohp: 44, deadlift: 150 },
  { username: "jack_au", country: "Australia", city: "Sydney", unit: "kg", visibility: "public", squat: 170, bench: 115, ohp: 68, deadlift: 210 },
  { username: "chloe_au", country: "Australia", city: "Melbourne", unit: "kg", visibility: "public", squat: 100, bench: 58, ohp: 39, deadlift: 130 },
  { username: "kenji_jp", country: "Japan", city: "Tokyo", unit: "kg", visibility: "public", squat: 160, bench: 105, ohp: 62, deadlift: 200 },
];

async function main() {
  console.log("Seeding exercises…");
  await db.insert(exercises).values(EXERCISES).onConflictDoNothing();

  console.log("Seeding fake leaderboard users…");
  await db
    .insert(profiles)
    .values(
      FAKE.map((f) => ({
        id: randomUUID(),
        username: f.username,
        country: f.country,
        city: f.city,
        preferredUnit: f.unit,
        visibility: f.visibility,
        squatKg: f.squat,
        benchKg: f.bench,
        ohpKg: f.ohp,
        deadliftKg: f.deadlift,
      })),
    )
    .onConflictDoNothing();

  const exRows = await db.select({ c: sql<number>`count(*)::int` }).from(exercises);
  const prRows = await db.select({ c: sql<number>`count(*)::int` }).from(profiles);
  console.log("Done.");
  console.log(`Exercises in library: ${exRows[0].c}, total profiles: ${prRows[0].c}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
