"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES, type LiftKey } from "@/lib/constants";
import { kgToDisplay, displayToKg, type Unit } from "@/lib/units";
import { updateProfile } from "@/app/(app)/actions";
import type { Profile } from "@/lib/db/schema";
import { toast } from "sonner";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

const LIFT_FIELDS: { key: LiftKey; label: string; col: keyof Profile }[] = [
  { key: "squat", label: "Squat", col: "squatKg" },
  { key: "bench", label: "Bench press", col: "benchKg" },
  { key: "ohp", label: "Overhead press", col: "ohpKg" },
  { key: "deadlift", label: "Deadlift", col: "deadliftKg" },
];

type PrState = Record<LiftKey, string>;

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>(profile.preferredUnit);
  const [saving, setSaving] = useState(false);
  const [prs, setPrs] = useState<PrState>(() => {
    const init = {} as PrState;
    for (const f of LIFT_FIELDS) {
      const v = kgToDisplay(profile[f.col] as number | null, profile.preferredUnit);
      init[f.key] = v == null ? "" : String(v);
    }
    return init;
  });

  // When the unit changes, re-express the typed numbers in the new unit so the
  // underlying weight stays the same (kg -> kg via the round-trip).
  function handleUnitChange(next: Unit) {
    if (next === unit) return;
    setPrs((cur) => {
      const out = {} as PrState;
      for (const f of LIFT_FIELDS) {
        const raw = cur[f.key];
        if (raw === "" || !Number.isFinite(Number(raw))) {
          out[f.key] = raw;
        } else {
          const kg = displayToKg(Number(raw), unit);
          out[f.key] = String(kgToDisplay(kg, next));
        }
      }
      return out;
    });
    setUnit(next);
  }

  async function onSubmit(formData: FormData) {
    setSaving(true);
    try {
      await updateProfile(formData);
      toast.success("Profile saved");
      router.refresh();
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={profile.username} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              name="country"
              defaultValue={profile.country}
              className={selectClass}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City (optional)</Label>
            <Input
              id="city"
              name="city"
              defaultValue={profile.city ?? ""}
              placeholder="Mumbai"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredUnit">Preferred unit</Label>
            <select
              id="preferredUnit"
              name="preferredUnit"
              value={unit}
              onChange={(e) => handleUnitChange(e.target.value as Unit)}
              className={selectClass}
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="lb">Pounds (lb)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profile visibility
        </h2>
        <div className="space-y-2">
          <select
            name="visibility"
            defaultValue={profile.visibility}
            className={`${selectClass} sm:max-w-md`}
          >
            <option value="hidden">Hidden — only you can open your profile</option>
            <option value="public">Public — anyone can view your split</option>
          </select>
          <p className="text-xs text-muted-foreground">
            You still appear on leaderboards either way. Visibility only controls
            your profile page.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your big 4 ({unit})
          </h2>
          <span className="text-xs text-muted-foreground">
            Fake it here. Not in the rack.
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {LIFT_FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={f.key}>{f.label}</Label>
              <div className="relative">
                <Input
                  id={f.key}
                  name={f.key}
                  type="number"
                  step="0.5"
                  min="0"
                  value={prs[f.key]}
                  onChange={(e) =>
                    setPrs((c) => ({ ...c, [f.key]: e.target.value }))
                  }
                  placeholder="0"
                  className="pr-10"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
