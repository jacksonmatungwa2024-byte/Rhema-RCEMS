"use client"

import { useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useLockWatcher(userRole?: string) {
  useEffect(() => {
    const checkLock = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "system_locked")
        .single()

      const isLocked = data?.value === true || data?.value === "true"

      // Only force logout if system is locked AND user is not admin
      if (isLocked && userRole !== "admin") {
        await supabase.auth.signOut()
        window.location.href = "/locked"
      }
    }

    // initial check
    checkLock()

    // real-time subscription
    const subscription = supabase
      .channel("lock-listener")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        (payload) => {
          const locked = payload.new?.value
          if ((locked === true || locked === "true") && userRole !== "admin") {
            supabase.auth.signOut().then(() => {
              window.location.href = "/locked"
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [userRole])
}
