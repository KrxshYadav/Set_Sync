import Link from "next/link";
import { getMyProfile } from "../actions";
import { getDayEntries, getExerciseLibrary } from "./queries";
import { SplitDay } from "@/components/split-day";
import { WEEKDAYS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{ day?: string }>;

function todayIndex() {
  // JS: 0=Sun..6=Sat  ->  ours: 0=Mon..6=Sun
  return (new Date().getDay() + 6) % 7;
}

export default async function SplitPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const parsed = Number(sp.day);
  const day =
    Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : todayIndex();

  const me = await getMyProfile();
  if (!me) return null;

  const [entries, library] = await Promise.all([
    getDayEntries(me.id, day),
    getExerciseLibrary(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My Split</h1>
        <p className="text-sm text-muted-foreground">
          Plan each day, then log your sets. Weights are in {me.preferredUnit}.
        </p>
      </div>

      {/* Weekday selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {WEEKDAYS.map((label, i) => (
          <Link
            key={label}
            href={`/split?day=${i}`}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              i === day
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="sm:hidden">{label.slice(0, 3)}</span>
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </div>

      <SplitDay
        weekday={day}
        entries={entries}
        library={library}
        unit={me.preferredUnit}
      />
    </div>
  );
}
