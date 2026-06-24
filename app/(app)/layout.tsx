import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "../(auth)/actions";
import { getMyProfile } from "@/lib/get-profile";
import { Button } from "@/components/ui/button";
import { DesktopNav, MobileNav } from "@/components/app-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cached: shared with the page below, so this is one DB round-trip per nav.
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-dvh pb-16 sm:pb-0">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/home" className="font-semibold tracking-tight">
            set<span className="text-lime-500">Sync</span>
          </Link>
          <DesktopNav />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href={`/u/${profile.username}`}
              className="flex items-center gap-2 rounded-full pl-1 pr-2 hover:bg-secondary"
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="size-7 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                  {(profile.fullName || profile.username).charAt(0).toUpperCase()}
                </span>
              )}
              <span className="hidden text-sm text-muted-foreground md:inline">
                @{profile.username}
              </span>
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <MobileNav />
      <Toaster />
    </div>
  );
}
