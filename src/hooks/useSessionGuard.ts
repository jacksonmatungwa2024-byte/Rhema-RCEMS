"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useSessionGuard() {
  const router = useRouter()

  useEffect(() => {
    const checkSessionAndLock = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session

      // No session or expired
      if (!session || !(session.expires_at && session.expires_at * 1000 > Date.now())) {
  router.push("/login?reason=expired")
  return
}

      // Login enabled?
      const { data: loginStatus } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "login_enabled")
        .single()

      const loginAllowed = loginStatus?.value?.toString() === "true"
      if (!loginAllowed) {
        router.push("/login?reason=locked")
        return
      }

      // Session revoked?
      const { data: revokeData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "session_revoked_at")
        .single()

      const revokedAt = revokeData?.value ? new Date(revokeData.value) : null
     const sessionStarted = session?.user?.last_sign_in_at
  ? new Date(session.user.last_sign_in_at)
  : null

      if (revokedAt && sessionStarted && sessionStarted.getTime() < revokedAt.getTime()) {
        router.push("/login?reason=expired")
      }
    }

    checkSessionAndLock()
  }, [router])
}
