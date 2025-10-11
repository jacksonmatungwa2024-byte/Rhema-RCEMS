"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import "./PastorMatangazo.css"

// 🔹 Define types
type Announcement = {
  title: string
  description: string
  files: File[]
  scheduled_for: string
}

type User = {
  id: string
  full_name: string
  role: string
  branch: string
  is_active: boolean
}

// 🔹 Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PastorMatangazo() {
  const [users, setUsers] = useState<User[]>([])
  const [branches, setBranches] = useState<string[]>([])
  const [branchFilter, setBranchFilter] = useState("")
  const [currentPastorBranch, setCurrentPastorBranch] = useState("Bukoba") // Change dynamically if using auth later
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { title: "", description: "", files: [], scheduled_for: "" }
  ])
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    fetchUsers()
    fetchHistory()
  }, [branchFilter])

  // 🔹 Fetch users
  async function fetchUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, role, branch, is_active")
      .eq("is_active", true)

    if (error) {
      console.error("Error fetching users:", error)
      return
    }

    const filtered = branchFilter
      ? data?.filter(u => u.branch === branchFilter)
      : data

    const uniqueBranches = Array.from(new Set(data?.map(u => u.branch).filter(Boolean))) as string[]

    setBranches(uniqueBranches)
    setUsers(filtered ?? [])
  }

  // 🔹 Fetch history of announcements sent
  async function fetchHistory() {
    const { data, error } = await supabase
      .from("pastor_announcements")
      .select("*")
      .eq("receiver_name", "Media Team")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("History fetch error:", error)
      return
    }
    setHistory(data || [])
  }

  // 🔹 Update announcement fields
  function updateAnnouncement<K extends keyof Announcement>(
    index: number,
    field: K,
    value: Announcement[K]
  ) {
    setAnnouncements(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // 🔹 Add announcement
  function addAnnouncement() {
    setAnnouncements(prev => [
      ...prev,
      { title: "", description: "", files: [], scheduled_for: "" }
    ])
  }

  // 🔹 Remove announcement
  function removeAnnouncement(index: number) {
    setAnnouncements(prev => prev.filter((_, i) => i !== index))
  }

  // 🔹 Submit announcements
  async function submitMatangazo() {
    if (announcements.some(a => !a.title)) {
      setMessage("⚠️ Tafadhali jaza kichwa cha kila tangazo.")
      return
    }

    setSubmitting(true)
    setMessage("⏳ Inatuma matangazo...")

    try {
      for (const ann of announcements) {
        const uploadedUrls: string[] = []

        // Upload all files (unlimited)
        for (const file of ann.files) {
          const fileName = `${Date.now()}_${file.name}`
          const { error: uploadError } = await supabase.storage
            .from("matangazo")
            .upload(fileName, file)

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from("matangazo")
            .getPublicUrl(fileName)

          if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl)
        }

        // Determine where to send
        const isBukoba = currentPastorBranch.toLowerCase() === "bukoba"
        const receiver = isBukoba ? "Media Team" : "Media Team"
        const status = isBukoba ? "approved" : "pending"

        // Insert record
        const { error: insertError } = await supabase.from("pastor_announcements").insert([
          {
            receiver_name: receiver,
            receiver_role: "Media Department",
            title: ann.title,
            description: ann.description,
            media_url: uploadedUrls.join(","), // multiple files comma-separated
            scheduled_for: ann.scheduled_for || null,
            status,
            sender_branch: currentPastorBranch
          }
        ])

        if (insertError) throw insertError
      }

      setMessage("✅ Matangazo yametumwa kwa mafanikio.")
      setAnnouncements([{ title: "", description: "", files: [], scheduled_for: "" }])
      fetchHistory()
    } catch (err) {
      console.error("Submit error:", err)
      setMessage("❌ Hitilafu imetokea wakati wa kutuma matangazo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pastor-matangazo-container">
      <h3>📣 Tuma Matangazo ({currentPastorBranch})</h3>

      {announcements.map((ann, i) => (
        <div key={i} className="announcement-block">
          <h4>Tangazo #{i + 1}</h4>

          <input
            type="text"
            placeholder="Kichwa cha Tangazo"
            value={ann.title}
            onChange={e => updateAnnouncement(i, "title", e.target.value)}
          />

          <textarea
            placeholder="Maelezo ya Tangazo"
            value={ann.description}
            onChange={e => updateAnnouncement(i, "description", e.target.value)}
          />

          <input
            type="datetime-local"
            value={ann.scheduled_for}
            onChange={e => updateAnnouncement(i, "scheduled_for", e.target.value)}
          />

          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
            onChange={e =>
              updateAnnouncement(i, "files", Array.from(e.target.files || []))
            }
          />

          <button className="remove-btn" onClick={() => removeAnnouncement(i)}>
            ❌ Ondoa Tangazo
          </button>
        </div>
      ))}

      <div className="buttons">
        <button onClick={addAnnouncement}>➕ Ongeza Tangazo</button>
        <button onClick={submitMatangazo} disabled={submitting}>
          {submitting ? "⏳ Inatuma..." : "📤 Tuma Matangazo"}
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      {/* 🕓 History Section */}
      <h3 style={{ marginTop: "30px" }}>🕓 Historia ya Matangazo</h3>
      {history.length === 0 ? (
        <p>Hakuna matangazo yaliyotumwa bado.</p>
      ) : (
        <div className="history-list">
          {history.map((h, idx) => (
            <div key={idx} className={`history-card ${h.viewed ? "viewed" : "pending"}`}>
              <h4>{h.title}</h4>
              <p>
                📅 {new Date(h.created_at).toLocaleString()} ·{" "}
                {h.status === "approved" ? "✅ Imeidhinishwa" : "⏳ Inasubiri"} ·{" "}
                {h.viewed
                  ? `👁️ Imeangaliwa ${h.viewed_at ? `(${new Date(h.viewed_at).toLocaleString()})` : ""
                    }`
                  : "❌ Haijaangaliwa"}
              </p>
              {h.media_url && (
                <div>
                  {h.media_url.split(",").map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      📎 Faili {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
