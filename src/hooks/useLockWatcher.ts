"use client"

import { useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useLockWatcher() {
  useEffect(() => {
    const checkLock = async () => {
      const { data } = await supabase
        .from("settings")
        .select("system_locked")
        .single()

      if (data?.system_locked) {
        // Logout and redirect
        await supabase.auth.signOut()
        window.location.href = "/locked"
      }
    }

    // Initial check
    checkLock()

    // Listen for real-time changes
    const subscription = supabase
      .channel("lock-listener")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        (payload) => {
          const locked = payload.new?.system_locked
          if (locked) {
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
  }, [])
}
