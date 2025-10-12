"use client"

import { useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type for a row in the "settings" table
interface Setting {
  key: string
  value: any // jsonb column can be boolean, string, object, etc.
  id: number
  [key: string]: any
}

export function useLockWatcher(userRole?: string) {
  useEffect(() => {
    const parseLockedValue = (value: any): boolean => {
      if (typeof value === "boolean") return value
      if (typeof value === "string") return value === "true"
      if (typeof value === "object" && value !== null && "locked" in value) {
        return Boolean(value.locked)
      }
      return false
    }

    const signOutIfLocked = async (locked: any) => {
      if (parseLockedValue(locked) && userRole !== "admin") {
        await supabase.auth.signOut()
        window.location.href = "/locked"
      }
    }

    const checkLock = async () => {
      try {
        const { data } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "system_locked")
          .single()

        const locked = data?.value
        await signOutIfLocked(locked)
      } catch (error) {
        console.error("Error checking lock status:", error)
      }
    }

    checkLock()

    const channel = supabase
      .channel("lock-listener")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "settings",
          filter: 'key=eq.system_locked',
        },
        (payload) => {
          const locked = payload.new?.value
          signOutIfLocked(locked)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userRole])
}
