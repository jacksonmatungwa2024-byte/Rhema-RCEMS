"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./StoragePanel.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FileMeta = {
  id: number;
  name: string;
  event_name: string;
  event_type: string;
  subtype?: string;
  url: string;
  created_at?: string;
  is_archived?: boolean;
  is_deleted?: boolean;
  visible_to_users?: boolean;
};

export default function StoragePanel() {
  const [tab, setTab] = useState<"upload" | "gallery">("upload");
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [subType, setSubType] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [groupedGallery, setGroupedGallery] = useState<Record<string, FileMeta[]>>({});
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    if (tab === "gallery") fetchGallery();
  }, [tab]);

  // ========== UPLOAD MULTIPLE ==========
  async function handleUpload() {
    if (files.length === 0) return alert("⚠️ Tafadhali chagua picha kwanza.");
    if (!eventName || !eventType) return alert("⚠️ Tafadhali jaza jina na aina ya tukio.");

    setLoading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${eventType}/${eventName}-${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage.from("media").upload(filePath, file);
        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);

        await supabase.from("media_metadata").insert({
          name: file.name,
          event_name: eventName,
          event_type: eventType,
          subtype: subType,
          url: urlData.publicUrl,
          is_archived: false,
          is_deleted: false,
          visible_to_users: true,
        });

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setFiles([]);
      setEventName("");
      setEventType("");
      setSubType("");
      alert("✅ Picha zimepakiwa kikamilifu!\n\n🕊️ Kila picha ni ushuhuda wa neema ya Mungu. Umefanya kazi ya kiroho kwa uaminifu.");
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Hitilafu wakati wa kupakia picha.");
    } finally {
      setLoading(false);
    }
  }

  // ========== GALLERY ==========
  async function fetchGallery() {
    let query = supabase
      .from("media_metadata")
      .select("*")
      .eq("is_deleted", false)
      .eq("is_archived", false);

    if (filterType) query = query.eq("event_type", filterType);
    if (filterDate) query = query.like("created_at", `${filterDate}%`);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Gallery error:", error);
      return;
    }

    const grouped = (data ?? []).reduce((acc, item) => {
      acc[item.event_type] = acc[item.event_type] || [];
      acc[item.event_type].push(item);
      return acc;
    }, {} as Record<string, FileMeta[]>);

    setGroupedGallery(grouped);
  }

  async function archiveFile(id: number) {
    await supabase.from("media_metadata").update({ is_archived: true }).eq("id", id);
    fetchGallery();
  }

  async function deleteFile(id: number) {
    await supabase.from("media_metadata").update({ is_deleted: true }).eq("id", id);
    fetchGallery();
  }

  async function toggleVisibility(id: number, current: boolean) {
    await supabase.from("media_metadata").update({ visible_to_users: !current }).eq("id", id);
    fetchGallery();
  }

  // ========== RENDER ==========
 return (
  <div className="storage-panel" style={{ padding: "20px", fontFamily: "sans-serif" }}>
    {/* Tabs */}
    <div className="tab-buttons" style={{ marginBottom: "10px" }}>
      <button
        onClick={() => setTab("upload")}
        className={tab === "upload" ? "active" : ""}
      >
        📤 Upload
      </button>
      <button
        onClick={() => setTab("gallery")}
        className={tab === "gallery" ? "active" : ""}
      >
        🖼️ Gallery
      </button>
    </div>

    {/* Upload tab */}
    {tab === "upload" && (
      <div className="upload-section">
        <label>Tukio:</label>
        <input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="Jina la tukio"
        />

        <label>Aina ya Tukio:</label>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          <option value="">-- Chagua --</option>
          <option value="sherehe">Sherehe</option>
          <option value="ibada">Ibada</option>
          <option value="kongamano">Kongamano</option>
          <option value="dharura">Dharura</option>
          <option value="ujenzi">Ujenzi</option>
          <option value="ladies">Ladies of Destiny</option>
        </select>

        {(eventType === "ibada" ||
          eventType === "kongamano" ||
          eventType === "dharura") && (
          <>
            <label>Aina ndogo:</label>
            <input
              value={subType}
              onChange={(e) => setSubType(e.target.value)}
              placeholder="Subtype / Maelezo zaidi"
            />
          </>
        )}

        <label>Chagua Picha:</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />

        {files.length > 0 && (
          <ul>
            {files.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        )}

        <button onClick={handleUpload} disabled={loading}>
          {loading ? "⏳ Inapakia..." : "🚀 Pakia Picha"}
        </button>

        {loading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p>{uploadProgress}% uploaded</p>
          </div>
        )}
      </div>
    )}

    {/* Gallery tab */}
    {tab === "gallery" && (
      <div className="gallery-section">
        {/* Filters */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="🔍 Aina ya Tukio"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <button onClick={fetchGallery}>🔄 Tumia Filters</button>
        </div>

        {Object.entries(groupedGallery).map(([type, files]) => (
          <div key={type} className="gallery-group">
            <h3>{type.toUpperCase()}</h3>
            <div className="gallery-grid">
              {files.map((item) => (
                <div key={item.id} className="gallery-item">
                  <img
                    src={item.url}
                    alt={item.name}
                    width={150}
                    height={150}
                  />
                  <div className="item-details">
                    <strong>{item.event_name}</strong>
                    <br />
                    <small>{item.subtype}</small>
                    <br />
                    <a href={item.url} download>
                      ⬇️ Pakua
                    </a>
                    <br />
                    <button onClick={() => archiveFile(item.id)}>📦</button>
                    <button onClick={() => deleteFile(item.id)}>🗑️</button>
                    <br />
                    <button
                      onClick={() =>
                        toggleVisibility(item.id, !!item.visible_to_users)
                      }
                    >
                      {item.visible_to_users
                        ? "🚫 Ficha kwa Users"
                        : "👁️ Ruhusu Users"}
                    </button>
                    <br />
                    <small>
                      {item.visible_to_users
                        ? "✅ Inaonekana kwa Users"
                        : "❌ Haionekani kwa Users"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
}