"use client"

import React, { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import "./Dashboard.css"
import { SpeedInsights } from "@vercel/speed-insights/next"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const accessMap: Record<string, string[]> = {
  admin: ["adminTab", "usherTab", "pastorTab", "mediaTab", "financeTab"],
  usher: ["usherTab"],
  pastor: ["pastorTab"],
  media: ["mediaTab"],
  finance: ["financeTab"],
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  usher: "Mhudumu",
  pastor: "Mchungaji",
  media: "Media",
  finance: "Fedha",
}

const Dashboard: React.FC = () => {
  const [role, setRole] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [branch, setBranch] = useState("")
  const [profileUrl, setProfileUrl] = useState("")
  const [lastLogin, setLastLogin] = useState("")
  const [statusLight, setStatusLight] = useState<"green" | "red" | "grey">("grey")
  const [statusText, setStatusText] = useState("⏳ Tafadhali chagua paneli.")
  const [themeVerse, setThemeVerse] = useState("")
  const [audioPlaying, setAudioPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // 🔒 Apply lock watcher, passing user role
  useLockWatcher(role)

  useEffect(() => {
    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const email = sessionData?.session?.user?.email
      if (!email) {
        window.location.href = "/login"
        return
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single()

      if (!userData) {
        alert("Haiwezekani kupata taarifa zako.")
        window.location.href = "/login"
        return
      }

      setRole(userData.role)
      setUsername(userData.username || "")
      setFullName(userData.full_name || "")
      setBranch(userData.branch || "")
      setProfileUrl(userData.profile_url || "")
      setLastLogin(userData.last_login ? new Date(userData.last_login).toLocaleString() : "")
    }

    const fetchTheme = async () => {
      const { data } = await supabase
        .from("tangazo")
        .select("message")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (data) setThemeVerse(data.message)
    }

    loadUser()
    fetchTheme()
  }, [])

  const handleClick = (tabId: string, page: string) => {
    if (!accessMap[role]?.includes(tabId)) {
      setStatusLight("red")
      setStatusText("🚫 Huna ruhusa ya kuingia sehemu hii.")
      return
    }

    setStatusLight("green")
    setStatusText(`✅ Unaelekezwa kwenye ${tabId}...`)
    window.location.href = page
  }

  const handleAudioPlay = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setAudioPlaying(true)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="theme-verse">“Nuru yako itangaze gizani.” — Isaya 60:1</div>

      <h2>Karibu {roleLabels[role] || ""} {fullName}</h2>

      {branch && <div className="info-block">📍 Tawi: {branch}</div>}
      {lastLogin && <div className="info-block">🕒 Ilipoingia mwisho: {lastLogin}</div>}
      <div className="info-block">📖 {themeVerse || "Leo ni siku ya neema na uzima."}</div>

      {profileUrl && <img src={profileUrl} alt="Profile" />}

      <button onClick={handleAudioPlay}>
        🔊 {audioPlaying ? "Inapigwa..." : "Play Theme"}
      </button>

      <audio ref={audioRef} loop>
        <source src="/ana.mp3" type="audio/mp3" />
      </audio>

      <div className={`status-indicator ${statusLight}`}>
        {statusText}
      </div>

      <div className="panel-links">
        <div onClick={() => handleClick("adminTab", "/admin")}>Admin Panel</div>
        <div onClick={() => handleClick("usherTab", "/usher")}>Usher Panel</div>
        <div onClick={() => handleClick("pastorTab", "/pastor")}>Pastor Panel</div>
        <div onClick={() => handleClick("mediaTab", "/media")}>Media Team</div>
        <div onClick={() => handleClick("financeTab", "/finance")}>Finance</div>
      </div>

      <SpeedInsights />
    </div>
  )
}

export default Dashboard
