"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./AdminMatangazo.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminMatangazo() {
  const [matangazo, setMatangazo] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);

  useEffect(() => {
    fetchMatangazo();
  }, []);

  async function fetchMatangazo() {
    const { data, error } = await supabase
      .from("tangazo")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setMatangazo(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    let media_url: string | null = null;
    let type = mediaType;

    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const fileName = `tangazo_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(`matangazo/${fileName}`, file);

      if (uploadError) {
        alert("⚠️ Kuna shida wakati wa kupakia faili.");
        setLoading(false);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("media")
        .getPublicUrl(`matangazo/${fileName}`);

      media_url = publicUrl.publicUrl;

      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
        type = "image";
      else if (["mp4", "mov", "avi", "webm"].includes(ext || ""))
        type = "video";
      else type = "file";
    }

    const { error } = await supabase.from("tangazo").insert([
      {
        title: title || null,
        message: message || null,
        image_url: media_url,
        media_type: type,
      },
    ]);

    if (error) {
      alert("⚠️ Kuna tatizo wakati wa kuhifadhi tangazo.");
    } else {
      setSuccess("✅ Tangazo limehifadhiwa kwa mafanikio!");
      setTitle("");
      setMessage("");
      setFile(null);
      setPreviewUrl(null);
      setMediaType(null);
      fetchMatangazo();
    }

    setLoading(false);
  }

  async function deleteTangazo(id: number) {
    if (!confirm("Una uhakika unataka kufuta tangazo hili?")) return;
    const { error } = await supabase.from("tangazo").delete().eq("id", id);
    if (!error) fetchMatangazo();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (!selectedFile) return;

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    setMediaType(
      ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")
        ? "image"
        : ["mp4", "mov", "avi", "webm"].includes(ext || "")
        ? "video"
        : "file"
    );
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  return (
    <div className="admin-matangazo-container">
      <h2>🎥 Pro Matangazo & Branding Live</h2>
      <p>Unda matangazo ya kisasa kama live broadcast (image, video, ppt, pdf).</p>

      <form onSubmit={handleSubmit}>
        <label>
          Kichwa (hiari):
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mfano: Tangazo la Jumapili ya Ibada Kuu"
          />
        </label>

        <label>
          Ujumbe (hiari):
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Weka ujumbe wa hiari..."
          />
        </label>

        <label>
          Faili la Tangazo:
          <input
            type="file"
            accept="image/*,video/*,.ppt,.pptx,.pdf"
            onChange={handleFileChange}
          />
        </label>

        {previewUrl && (
          <div className="preview-box">
            {mediaType === "video" ? (
              <video src={previewUrl} autoPlay loop muted playsInline />
            ) : mediaType === "image" ? (
              <img src={previewUrl} alt="Preview" />
            ) : (
              <div>📄 Huu ni faili la {mediaType?.toUpperCase()}</div>
            )}
            <div>
              {title && <h3>{title}</h3>}
              {message && <p>{message}</p>}
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "⏳ Inahifadhi..." : "🚀 Tangaza Live"}
        </button>

        {success && <p>{success}</p>}
      </form>

      <h3>📰 Matangazo Yaliyopo</h3>
      {matangazo.length === 0 ? (
        <p>Hakuna tangazo bado.</p>
      ) : (
        <div>
          {matangazo.map((t: any) => (
            <div key={t.id} className="tangazo-item">
              <h4>{t.title}</h4>
              <p>{t.message}</p>
              {t.image_url &&
                (t.media_type === "video" ? (
                  <video src={t.image_url} controls />
                ) : (
                  <img src={t.image_url} alt="Tangazo" />
                ))}
              <button onClick={() => deleteTangazo(t.id)}>🗑️ Futa</button>
            </div>
          ))}
        </div>
      )}

      {matangazo.length > 0 && (
        <div className="live-ticker">
          <span>
            {matangazo[0].title && <strong>{matangazo[0].title}: </strong>}
            {matangazo[0].message}
          </span>
        </div>
      )}
    </div>
  );
}
