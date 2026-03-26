import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Browser-safe client — uses anon key, respects RLS.
 * Note: typed with `any` for now; replace with Supabase CLI-generated types
 * (`supabase gen types typescript`) when connecting the Supabase CLI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);

/**
 * Server-only admin client — uses service role key, bypasses RLS.
 * Never expose this client to the browser.
 */
export function createAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY — admin client requires service role key");
  }
  return createClient<any>(supabaseUrl!, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
