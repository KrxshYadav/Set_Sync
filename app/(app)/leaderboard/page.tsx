import Link from "next/link";
import { getMyProfile } from "../actions";
import { getLeaderboard } from "./queries";
import { LIFTS, type LiftKey } from "@/lib/constants";
import { formatWeight } from "@/lib/units";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{ lift?: string; scope?: string }>;

const MEDAL = ["text-amber-500", "text-zinc-400", "text-amber-700"];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const lift = (LIFTS.find((l) => l.key === sp.lift)?.key ?? "squat") as LiftKey;
  const scope = sp.scope === "country" ? "country" : "world";

  const me = await getMyProfile();
  const unit = me?.preferredUnit ?? "kg";
  const myCountry = me?.country ?? "Other";

  const rows = await getLeaderboard(
    lift,
    scope === "country" ? myCountry : undefined,
  );
  const liftLabel = LIFTS.find((l) => l.key === lift)!.label;

  const href = (next: { lift?: string; scope?: string }) =>
    `/leaderboard?lift=${next.lift ?? lift}&scope=${next.scope ?? scope}`;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Real numbers only count under a loaded bar — but flex here anyway.
        </p>
      </div>

      {/* Lift selector */}
      <div className="flex flex-wrap gap-2">
        {LIFTS.map((l) => (
          <Link
            key={l.key}
            href={href({ lift: l.key })}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              l.key === lift
                ? "border-lime-500 bg-lime-500/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Scope tabs */}
      <div className="inline-flex rounded-lg border p-1 text-sm">
        <Link
          href={href({ scope: "world" })}
          className={cn(
            "rounded-md px-4 py-1.5 font-medium transition-colors",
            scope === "world"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          🌍 Worldwide
        </Link>
        <Link
          href={href({ scope: "country" })}
          className={cn(
            "rounded-md px-4 py-1.5 font-medium transition-colors",
            scope === "country"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📍 {myCountry}
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[3rem_1fr_8rem_auto]">
          <span>#</span>
          <span>Lifter</span>
          <span className="hidden sm:block">Location</span>
          <span className="text-right">{liftLabel}</span>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No one has logged a {liftLabel.toLowerCase()} here yet.
            <br />
            Be the first — set yours in Settings.
          </div>
        ) : (
          rows.map((r) => {
            const mine = me?.id === r.id;
            return (
              <div
                key={r.id}
                className={cn(
                  "grid grid-cols-[3rem_1fr_auto] items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[3rem_1fr_8rem_auto]",
                  mine && "bg-lime-500/10",
                )}
              >
                <span
                  className={cn(
                    "font-bold tabular-nums",
                    r.rank <= 3 ? MEDAL[r.rank - 1] : "text-muted-foreground",
                  )}
                >
                  {r.rank <= 3 ? "🏅" : ""}
                  {r.rank}
                </span>
                <span className="truncate font-medium">
                  @{r.username}
                  {mine && (
                    <span className="ml-2 rounded bg-lime-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-lime-700">
                      you
                    </span>
                  )}
                </span>
                <span className="hidden truncate text-muted-foreground sm:block">
                  {r.city ? `${r.city}, ` : ""}
                  {r.country}
                </span>
                <span className="text-right font-semibold tabular-nums">
                  {formatWeight(r.weightKg, unit)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {me && !rows.some((r) => r.id === me.id) && (
        <p className="text-center text-sm text-muted-foreground">
          You&apos;re not on this board yet —{" "}
          <Link href="/settings" className="font-medium text-foreground underline">
            add your {liftLabel.toLowerCase()}
          </Link>
          .
        </p>
      )}
    </div>
  );
}
