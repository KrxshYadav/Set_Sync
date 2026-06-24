import Link from "next/link";
import { Search as SearchIcon, Lock } from "lucide-react";
import { getMyProfile } from "@/lib/get-profile";
import { searchUsers } from "./queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

type SearchParams = Promise<{ q?: string }>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "" } = await searchParams;
  const me = await getMyProfile();
  const results = q.trim() ? await searchUsers(q, me?.id) : [];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Find lifters</h1>
        <p className="text-sm text-muted-foreground">
          Search by username to check out someone&apos;s split and big 4.
        </p>
      </div>

      <form action="/search" className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="e.g. rohan"
            className="pl-9"
            autoFocus
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="space-y-2">
        {q.trim() && results.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No lifters match “{q}”.
          </p>
        )}
        {results.map((u) => (
          <Link
            key={u.id}
            href={`/u/${u.username}`}
            className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-secondary"
          >
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                url={u.avatarUrl}
                name={u.fullName || u.username}
                className="size-9"
              />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {u.fullName ? u.fullName : `@${u.username}`}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {u.fullName ? `@${u.username} · ${u.country}` : u.country}
                </p>
              </div>
            </div>
            {u.visibility === "hidden" && (
              <Lock className="size-4 shrink-0 text-muted-foreground" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
