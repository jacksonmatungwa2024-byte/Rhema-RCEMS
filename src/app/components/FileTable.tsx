"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useBucket } from "./BucketContext"
import "./FileTable.css"
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FileTable() {
  const { selectedBucket } = useBucket()
  const [files, setFiles] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
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
      console.error("Supabase fetch error:", error)
      setErrorMsg(error.message)
    } else {
      setFiles(data || [])
    }
    setLoading(false)
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const filteredFiles = files.filter((file) => {
    const name = file.name.toLowerCase()
    const matchesSearch = name.includes(searchTerm.toLowerCase())
    const matchesType =
      filterType === "all" ||
      (filterType === "image" && name.match(/\.(jpg|jpeg|png|gif)$/i)) ||
      (filterType === "video" && name.match(/\.(mp4|mov|avi)$/i)) ||
      (filterType === "doc" && name.match(/\.(pdf|docx|txt)$/i))
    return matchesSearch && matchesType
  })

  const downloadFile = async (name: string) => {
    const { data } = supabase.storage.from(selectedBucket!).getPublicUrl(name)
    if (data?.publicUrl) window.open(data.publicUrl, "_blank")
  }

  const deleteFile = async (name: string) => {
    const { error } = await supabase.storage.from(selectedBucket!).remove([name])
    if (error) alert("Delete failed: " + error.message)
    else fetchFiles()
  }

  if (!selectedBucket) {
    return <p>Please select a bucket first.</p>
  }

  return (
  <div className="file-table-container">
    <h2>📁 Files in {selectedBucket}</h2>

    <div className="file-controls">
      <input
        type="text"
        placeholder="Search files..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
        <option value="all">All</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
        <option value="doc">Documents</option>
      </select>
      <button onClick={fetchFiles}>🔄 Refresh</button>
    </div>

    {loading && <p>Loading files...</p>}
    {errorMsg && <p style={{ color: "red" }}>Error: {errorMsg}</p>}

    {!loading && !errorMsg && filteredFiles.length === 0 && <p>No files found.</p>}

    {!loading && filteredFiles.length > 0 && (
      <table className="file-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Modified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFiles.map((file) => (
            <tr key={file.name}>
              <td>{file.name}</td>
              <td>{formatBytes(file.metadata?.size || 0)}</td>
              <td>{file.updated_at ? new Date(file.updated_at).toLocaleString() : "N/A"}</td>
              <td>
                <button onClick={() => downloadFile(file.name)}>⬇️</button>
                <button onClick={() => deleteFile(file.name)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)
}
