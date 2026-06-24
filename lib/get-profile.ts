import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/app/(app)/actions";

// Cached per-request: the app layout and the page both call this on every
// navigation; `cache()` collapses them into a single DB round-trip.
export const getMyProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return ensureProfile(user);
});
