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

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "undisclosed", label: "Prefer not to say" },
] as const;

/** Whole-years age from a 'YYYY-MM-DD' date of birth, or null. */
export function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

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
