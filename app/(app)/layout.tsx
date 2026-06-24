import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";
import { ensureProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { DesktopNav, MobileNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Make sure a profile row exists for this user (covers Google sign-ups too).
  const profile = await ensureProfile(user);

  return (
    <div className="min-h-dvh pb-16 sm:pb-0">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/home" className="font-semibold tracking-tight">
            set<span className="text-lime-500">Sync</span>
          </Link>
          <DesktopNav />
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">
              @{profile?.username}
            </span>
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
