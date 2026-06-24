// Shared static data.

export const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Germany",
  "Canada",
  "Australia",
  "France",
  "Brazil",
  "Japan",
  "Nigeria",
  "Other",
] as const;

export type LiftKey = "squat" | "bench" | "ohp" | "deadlift";

export const LIFTS: { key: LiftKey; label: string; column: string }[] = [
  { key: "squat", label: "Squat", column: "squatKg" },
  { key: "bench", label: "Bench Press", column: "benchKg" },
  { key: "ohp", label: "Overhead Press", column: "ohpKg" },
  { key: "deadlift", label: "Deadlift", column: "deadliftKg" },
];

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
