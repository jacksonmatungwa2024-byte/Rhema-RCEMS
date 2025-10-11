"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useBucket } from "./BucketContext"
import "./BucketExplorer.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BucketExplorer() {
  const { setSelectedBucket } = useBucket()
  const [buckets, setBuckets] = useState<{ id: string }[]>([])
  const [bucketSizes, setBucketSizes] = useState<Record<string, number>>({})
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBuckets()
  }, [])

  const fetchBuckets = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: bucketList, error } = await supabase.storage.listBuckets()

      if (error) throw error
      if (!bucketList || bucketList.length === 0) {
        setError("⚠️ No buckets found in Supabase storage.")
        setBuckets([])
        setLoading(false)
        return
      }

      setBuckets(bucketList)
      const sizes: Record<string, number> = {}

      for (const bucket of bucketList) {
        const { data: fileList, error: listError } = await supabase.storage
          .from(bucket.id)
          .list("", { limit: 1000 })

        if (listError) {
          console.warn(`Error listing files in bucket ${bucket.id}:`, listError.message)
          continue
        }

        if (fileList) {
          const total = fileList.reduce(
            (sum, file) => sum + (file.metadata?.size || 0),
            0
          )
          sizes[bucket.id] = total
        }
      }

      setBucketSizes(sizes)
    } catch (err: any) {
      console.error("Error fetching buckets:", err.message)
      setError("❌ Failed to fetch buckets. Check your Supabase keys or storage settings.")
    }

    setLoading(false)
  }

  const loadFiles = async (bucketId: string) => {
    setExpandedBucket(bucketId)
    const { data: fileList, error } = await supabase.storage
      .from(bucketId)
      .list("", { limit: 1000 })
    if (error) console.error("Error loading files:", error.message)
    if (fileList) setFiles(fileList)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="bucket-explorer">
      <h2>🗂️ Bucket Explorer</h2>
      <p>Click a bucket to view its files and select it for other tabs.</p>

      <button onClick={fetchBuckets}>🔄 Refresh Buckets</button>

      {loading && <p>⏳ Loading buckets...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && buckets.length === 0 && <p>No buckets found.</p>}

      {!loading && !error && buckets.length > 0 && (
        <div className="bucket-list">
          {buckets.map((bucket) => (
            <div key={bucket.id} className="bucket-card">
              <div
                className="bucket-header"
                onClick={() => loadFiles(bucket.id)}
                role="button"
                tabIndex={0}
              >
                <strong>{bucket.id}</strong>{" "}
                <span>{formatBytes(bucketSizes[bucket.id] || 0)}</span>
              </div>

              <button onClick={() => setSelectedBucket(bucket.id)}>
                ✅ Select
              </button>

              {expandedBucket === bucket.id && (
                <div className="file-list">
                  {files.length === 0 ? (
                    <p>No files found.</p>
                  ) : (
                    <ul>
                      {files.map((file) => (
                        <li key={file.name}>
                          {file.name} — {formatBytes(file.metadata?.size || 0)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
