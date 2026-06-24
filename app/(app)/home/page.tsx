import Link from "next/link";
import { Dumbbell, Trophy, Settings, ArrowRight } from "lucide-react";
import { getMyProfile } from "@/lib/get-profile";
import { getStandings } from "./queries";
import { formatWeight } from "@/lib/units";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const profile = await getMyProfile();
  if (!profile) return null;

  const unit = profile.preferredUnit;
  const standings = await getStandings(profile);
  const hasLifts = standings.length > 0;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {profile.fullName || `@${profile.username}`}
        </h1>
      </div>

      {/* Standings or call-to-action */}
      {hasLifts ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your standings
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {standings.map((s) => (
              <div key={s.key} className="rounded-xl border p-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-medium">{s.label}</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatWeight(s.weightKg, unit)}
                  </p>
                </div>
                <div className="mt-3 flex gap-2 text-sm">
                  <span className="rounded-md bg-lime-500/10 px-2 py-1 font-medium text-lime-700 dark:text-lime-400">
                    #{s.countryRank}{" "}
                    <span className="text-muted-foreground">
                      in {profile.country}
                    </span>
                  </span>
                  <span className="rounded-md bg-secondary px-2 py-1 font-medium">
                    #{s.worldRank}{" "}
                    <span className="text-muted-foreground">worldwide</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            See the full leaderboard <ArrowRight className="size-4" />
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border bg-gradient-to-br from-lime-500/10 to-transparent p-6">
          <h2 className="text-lg font-semibold">Get on the board</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Add your squat, bench, overhead press and deadlift to see how you
            rank in {profile.country} and worldwide.
          </p>
          <Button className="mt-4" render={<Link href="/settings" />}>
            Add your big 4
          </Button>
        </section>
      )}

      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-3">
        <QuickLink
          href="/split"
          icon={<Dumbbell className="size-5" />}
          title="My Split"
          desc="Plan & log your week"
        />
        <QuickLink
          href="/leaderboard"
          icon={<Trophy className="size-5" />}
          title="Leaderboard"
          desc="Squat · Bench · OHP · Deadlift"
        />
        <QuickLink
          href="/settings"
          icon={<Settings className="size-5" />}
          title="Settings"
          desc="Country, units, visibility"
        />
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border p-4 transition-colors hover:bg-secondary"
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground group-hover:bg-background">
        {icon}
      </div>
      <p className="mt-3 font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
