"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES, GENDERS, calcAge, type LiftKey } from "@/lib/constants";
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
  const [dob, setDob] = useState(profile.dob ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatarUrl,
  );
  const [prs, setPrs] = useState<PrState>(() => {
    const init = {} as PrState;
    for (const f of LIFT_FIELDS) {
      const v = kgToDisplay(profile[f.col] as number | null, profile.preferredUnit);
      init[f.key] = v == null ? "" : String(v);
    }
    return init;
  });

  const age = calcAge(dob);

  function handleUnitChange(next: Unit) {
    if (next === unit) return;
    setPrs((cur) => {
      const out = {} as PrState;
      for (const f of LIFT_FIELDS) {
        const raw = cur[f.key];
        if (raw === "" || !Number.isFinite(Number(raw))) out[f.key] = raw;
        else {
          const kg = displayToKg(Number(raw), unit);
          out[f.key] = String(kgToDisplay(kg, next));
        }
      }
      return out;
    });
    setUnit(next);
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(formData: FormData) {
    setSaving(true);
    try {
      const res = await updateProfile(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Profile saved");
        router.refresh();
      }
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-8">
      {/* Avatar */}
      <section className="flex items-center gap-4">
        <div className="relative">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt="avatar"
              className="size-20 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-secondary text-2xl font-semibold text-muted-foreground">
              {(profile.fullName || profile.username).charAt(0).toUpperCase()}
            </div>
          )}
          <label
            htmlFor="avatar"
            className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-foreground text-background"
          >
            <Camera className="size-3.5" />
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              className="sr-only"
            />
          </label>
        </div>
        <div>
          <p className="font-medium">Profile photo</p>
          <p className="text-sm text-muted-foreground">JPG, PNG or WebP, up to 2 MB.</p>
        </div>
      </section>

      {/* Identity */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          About you
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={profile.fullName ?? ""}
              placeholder="Krish Yadav"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              defaultValue={profile.username}
              placeholder="benchpress_ben"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              name="gender"
              defaultValue={profile.gender ?? ""}
              className={selectClass}
            >
              <option value="">Select…</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">
              Date of birth{age != null ? ` · ${age} yrs` : ""}
            </Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              value={dob}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Location & units */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Location & units
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
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

      {/* Visibility */}
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

      {/* Big 4 */}
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
