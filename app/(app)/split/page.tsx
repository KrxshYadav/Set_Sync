import Link from "next/link";
import { getMyProfile } from "@/lib/get-profile";
import { getDayEntries, getExerciseLibrary } from "./queries";
import { SplitDay } from "@/components/split-day";
import { TodaySession } from "@/components/today-session";
import { WEEKDAYS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{ view?: string; day?: string }>;

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
  const view = sp.view === "plan" ? "plan" : "today";
  const today = todayIndex();

  const me = await getMyProfile();
  if (!me) return null;

  const tab = (key: "today" | "plan", label: string) => (
    <Link
      href={`/split?view=${key}`}
      className={cn(
        "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
        view === key
          ? "bg-background text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Workout</h1>
        <p className="text-sm text-muted-foreground">
          Weights are in {me.preferredUnit}.
        </p>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-lg border bg-muted/40 p-1">
        {tab("today", "Today")}
        {tab("plan", "Plan week")}
      </div>

      {view === "today" ? (
        <TodayTab userId={me.id} today={today} unit={me.preferredUnit} />
      ) : (
        <PlanTab userId={me.id} today={today} sp={sp} unit={me.preferredUnit} />
      )}
    </div>
  );
}

async function TodayTab({
  userId,
  today,
  unit,
}: {
  userId: string;
  today: number;
  unit: "kg" | "lb";
}) {
  const entries = await getDayEntries(userId, today);
  const dateKey = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">
        {WEEKDAYS[today]}&apos;s session
      </p>
      <TodaySession
        weekday={today}
        entries={entries}
        unit={unit}
        dateKey={dateKey}
      />
    </div>
  );
}

async function PlanTab({
  userId,
  today,
  sp,
  unit,
}: {
  userId: string;
  today: number;
  sp: { day?: string };
  unit: "kg" | "lb";
}) {
  const parsed = Number(sp.day);
  const day =
    Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : today;
  const [entries, library] = await Promise.all([
    getDayEntries(userId, day),
    getExerciseLibrary(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {WEEKDAYS.map((label, i) => (
          <Link
            key={label}
            href={`/split?view=plan&day=${i}`}
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
      <SplitDay weekday={day} entries={entries} library={library} unit={unit} />
    </div>
  );
}
