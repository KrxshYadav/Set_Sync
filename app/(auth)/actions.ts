"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = { error: string } | null;

// We sign up / sign in with an email derived from the username so the user only
// ever types a username + password (per the PRD). Real email is optional later.
function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@setsync.local`;
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Enter a username and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) return { error: "Wrong username or password." };

  revalidatePath("/", "layout");
  redirect("/home");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (username.length < 3) return { error: "Username must be 3+ characters." };
  if (password.length < 6) return { error: "Password must be 6+ characters." };

  const email = usernameToEmail(username);

  // Create an already-confirmed user via the admin API so the username/password
  // flow works without email confirmation (our usernames map to a fake domain).
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });
  if (createError) {
    const msg = /already/i.test(createError.message)
      ? "That username is taken."
      : createError.message;
    return { error: msg };
  }

  // Now establish the session cookie for this browser.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/home");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
