"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signIn,
  signUp,
  signInWithGoogle,
  type AuthState,
} from "../actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    null,
  );

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: brand panel (hidden on small screens) */}
      <aside className="relative hidden flex-col justify-between bg-neutral-950 p-10 text-neutral-100 lg:flex">
        <div className="text-lg font-semibold tracking-tight">
          set<span className="text-lime-400">Sync</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight">
            Log the work.
            <br />
            Climb the board.
          </h1>
          <p className="max-w-sm text-neutral-400">
            Track your weekly split and see how your squat, bench, OHP and
            deadlift stack up — in your country and worldwide.
          </p>
        </div>
        <p className="text-sm text-neutral-500">
          You can fake your numbers here. Not in the squat rack.
        </p>
      </aside>

      {/* Right: auth form */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 lg:hidden">
            <div className="text-2xl font-semibold tracking-tight">
              set<span className="text-lime-500">Sync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Track your lifts. Climb the board.
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to log today's session."
                : "Pick a username and start lifting."}
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="benchpress_ben"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {state?.error && (
              <p className="text-sm font-medium text-red-600">{state.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            OR
            <span className="h-px flex-1 bg-border" />
          </div>

          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" className="w-full">
              Continue with Google
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button
              type="button"
              onClick={() =>
                setMode(mode === "signin" ? "signup" : "signin")
              }
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
