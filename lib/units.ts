// Canonical weight unit is KILOGRAMS everywhere in the DB.
// These helpers convert only at the UI / form boundary.

export type Unit = "kg" | "lb";

const LB_PER_KG = 2.2046226;

/** Convert a stored kg value to the user's display unit, rounded to 1 decimal. */
export function kgToDisplay(kg: number | null | undefined, unit: Unit): number | null {
  if (kg == null) return null;
  const value = unit === "kg" ? kg : kg * LB_PER_KG;
  return Math.round(value * 10) / 10;
}

/** Convert a value typed by the user (in their unit) back to kg for storage. */
export function displayToKg(value: number, unit: Unit): number {
  const kg = unit === "kg" ? value : value / LB_PER_KG;
  return Math.round(kg * 100) / 100;
}

/** Format a stored kg value as a display string, e.g. "140 kg" or "308.6 lb". */
export function formatWeight(kg: number | null | undefined, unit: Unit): string {
  const v = kgToDisplay(kg, unit);
  if (v == null) return "—";
  // Drop a trailing ".0" for cleaner display.
  const num = Number.isInteger(v) ? v.toString() : v.toString();
  return `${num} ${unit}`;
}
