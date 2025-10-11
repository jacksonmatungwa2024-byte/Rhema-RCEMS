// src/utils/supabase/client.ts
import { createClient } from "@supabase/supabase-js"

// ✅ Public URL and ANON key only (safe for client)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false, // ✅ Keeps users logged in (refresh-safe)
      autoRefreshToken: true, // ✅ Automatically refreshes session tokens
      detectSessionInUrl: true, // ✅ Handles OAuth redirects
      storageKey: "supabase.auth.token", // Custom key for localStorage
    },
  }
)
