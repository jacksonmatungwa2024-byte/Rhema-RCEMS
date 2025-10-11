"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useBucket } from "./BucketContext"
import "./CleanupSuggestions.css";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CleanupSuggestions() {
  const { selectedBucket } = useBucket()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (selectedBucket) fetchFiles()
  }, [selectedBucket])

  const fetchFiles = async () => {
    if (!selectedBucket) return
    setLoading(true)
    setErrorMsg(null)

    const { data, error } = await supabase.storage.from(selectedBucket).list("", { limit: 1000 })
    if (error) {
      setErrorMsg(error.message)
    } else {
      setFiles(data || [])
    }
    setLoading(false)
  }

  const isLarge = (size: number) => size > 50 * 1024 * 1024
  const isOld = (modified: string) => {
    const date = new Date(modified)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return date < sixMonthsAgo
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const cleanupCandidates = files.filter(
    (file) => isLarge(file.metadata?.size || 0) || isOld(file.metadata?.lastModified || "")
  )

  const deleteFile = async (name: string) => {
    const { error } = await supabase.storage.from(selectedBucket!).remove([name])
    if (error) alert("Delete failed: " + error.message)
    else fetchFiles()
  }

  if (!selectedBucket) return <p>Please select a bucket first.</p>


return (
  <div className="cleanup-suggestions-container">
    <h2>🧹 Cleanup Suggestions for {selectedBucket}</h2>
    <p>Files that are large or older than 6 months.</p>

    {loading && <p>⏳ Scanning files...</p>}
    {errorMsg && <p style={{ color: "red" }}>Error: {errorMsg}</p>}

    {!loading && !errorMsg && cleanupCandidates.length === 0 && (
      <p>✅ No cleanup suggestions. Your bucket is lean and clean!</p>
    )}

    {!loading && cleanupCandidates.length > 0 && (
      <ul>
        {cleanupCandidates.map((file) => (
          <li key={file.name}>
            <span>
              {file.name} — {formatBytes(file.metadata?.size || 0)} —{" "}
              {new Date(file.metadata?.lastModified || "").toLocaleDateString()}
            </span>
            <button onClick={() => deleteFile(file.name)}>🗑️ Delete</button>
          </li>
        ))}
      </ul>
    )}
  </div>
);
}