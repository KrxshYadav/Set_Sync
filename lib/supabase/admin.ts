import { createClient } from "@supabase/supabase-js";

// Service-role client. SERVER ONLY — bypasses Row Level Security.
// Used for signup (auto-confirm users) and the seed script.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
