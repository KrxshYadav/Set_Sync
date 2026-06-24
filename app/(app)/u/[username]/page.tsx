import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { getMyProfile } from "@/lib/get-profile";
import { getProfileByUsername, getSplitOverview } from "../../search/queries";
import { LIFTS, WEEKDAYS, GENDERS, calcAge } from "@/lib/constants";
import { formatWeight } from "@/lib/units";
import { Badge } from "@/components/ui/badge";

type Params = Promise<{ username: string }>;

export default async function PublicProfilePage({
  params,
}: {
  params: Params;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(decodeURIComponent(username));
  if (!profile) notFound();

  const me = await getMyProfile();
  const unit = me?.preferredUnit ?? "kg";
  const isSelf = me?.id === profile.id;
  const canView = profile.visibility === "public" || isSelf;

  if (!canView) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">@{profile.username} is private</h1>
        <p className="text-sm text-muted-foreground">
          This lifter keeps their split to themselves. They still count on the
          leaderboards.
        </p>
        <Link href="/leaderboard" className="text-sm font-medium underline">
          Back to the leaderboard
        </Link>
      </div>
    );
  }

  const split = await getSplitOverview(profile.id);
  const lifts = [
    { label: "Squat", kg: profile.squatKg },
    { label: "Bench", kg: profile.benchKg },
    { label: "OHP", kg: profile.ohpKg },
    { label: "Deadlift", kg: profile.deadliftKg },
  ];
  const total =
    (profile.squatKg ?? 0) + (profile.benchKg ?? 0) + (profile.deadliftKg ?? 0);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.username}
              className="size-16 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-2xl font-semibold text-muted-foreground">
              {(profile.fullName || profile.username).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            {profile.fullName && (
              <h1 className="text-2xl font-semibold tracking-tight">
                {profile.fullName}
              </h1>
            )}
            <p className={profile.fullName ? "text-muted-foreground" : "text-2xl font-semibold tracking-tight"}>
              @{profile.username}
            </p>
            <p className="text-sm text-muted-foreground">
              {[
                profile.city ? `${profile.city}, ${profile.country}` : profile.country,
                calcAge(profile.dob) != null ? `${calcAge(profile.dob)} yrs` : null,
                GENDERS.find((g) => g.value === profile.gender)?.label ?? null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        {isSelf && (
          <Link href="/settings" className="text-sm font-medium underline">
            Edit
          </Link>
        )}
      </div>

      {/* Big 4 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          The big 4
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {lifts.map((l) => (
            <div key={l.label} className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {l.label}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatWeight(l.kg, unit)}
              </p>
            </div>
          ))}
        </div>
        {total > 0 && (
          <p className="text-sm text-muted-foreground">
            S/B/D total:{" "}
            <span className="font-semibold text-foreground">
              {formatWeight(total, unit)}
            </span>
          </p>
        )}
      </section>

      {/* Split */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Weekly split
        </h2>
        {split.size === 0 ? (
          <p className="text-sm text-muted-foreground">
            No split logged yet.
          </p>
        ) : (
          <div className="space-y-3">
            {WEEKDAYS.map((label, i) => {
              const items = split.get(i);
              if (!items || items.length === 0) return null;
              return (
                <div key={label} className="rounded-xl border p-4">
                  <p className="mb-2 font-medium">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((it, idx) => (
                      <Badge key={idx} variant="secondary">
                        {it.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
