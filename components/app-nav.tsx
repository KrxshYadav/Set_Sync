"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Trophy, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/split", label: "Split", icon: Dumbbell },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-background/95 backdrop-blur sm:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
              active ? "text-lime-600" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
