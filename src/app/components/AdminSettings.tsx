"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";
import "./AdminSettings.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Settings = {
  id: number | null;
  branch_name: string;
  logo_url: string;
  scroll_speed: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  is_active: boolean;
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    id: null,
    branch_name: "",
    logo_url: "",
    scroll_speed: "normal",
    primary_color: "#6a1b9a",
    secondary_color: "#9c27b0",
    background_color: "#f3e5f5",
    text_color: "#4a148c",
    is_active: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error(error);
      toast.error("Failed to load settings");
    } else if (data) {
      setSettings({
        id: data.id ?? null,
        branch_name: data.branch_name ?? "",
        logo_url: data.logo_url ?? "",
        scroll_speed: data.scroll_speed ?? "normal",
        primary_color: data.primary_color ?? "#6a1b9a",
        secondary_color: data.secondary_color ?? "#9c27b0",
        background_color: data.background_color ?? "#f3e5f5",
        text_color: data.text_color ?? "#4a148c",
        is_active: data.is_active ?? false,
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const payload = { ...settings };

    const { data, error } = settings.id
      ? await supabase
          .from("settings")
          .update(payload)
          .eq("id", settings.id)
          .select()
          .single()
      : await supabase
          .from("settings")
          .insert([payload])
          .select()
          .single();

    if (error) {
      console.error("Supabase error:", error);
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved successfully");
      fetchSettings();
    }

    setSaving(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;

    setSettings((prev) => ({
      ...prev,
      [target.name]: value,
    }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setUploading(true);

      const fileName = `logo-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("logos").getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        setSettings((prev) => ({ ...prev, logo_url: publicUrlData.publicUrl }));
        toast.success("Logo uploaded successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <p>Loading settings...</p>;

  return (
    <div className="admin-settings-container">
      {/* FORM */}
      <form onSubmit={handleSave}>
        <h2>⚙️ Admin Settings</h2>

        <label>
          Branch Name:
          <input
            type="text"
            name="branch_name"
            value={settings.branch_name}
            onChange={handleChange}
          />
        </label>

        <label>
          Logo:
          <input type="file" onChange={handleFileUpload} />
        </label>

        <label>
          Scroll Speed:
          <select name="scroll_speed" value={settings.scroll_speed} onChange={handleChange}>
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </label>

        <label>
          Primary Color:
          <input
            type="color"
            name="primary_color"
            value={settings.primary_color}
            onChange={handleChange}
          />
        </label>

        <label>
          Secondary Color:
          <input
            type="color"
            name="secondary_color"
            value={settings.secondary_color}
            onChange={handleChange}
          />
        </label>

        <label>
          Background Color:
          <input
            type="color"
            name="background_color"
            value={settings.background_color}
            onChange={handleChange}
          />
        </label>

        <label>
          Text Color:
          <input
            type="color"
            name="text_color"
            value={settings.text_color}
            onChange={handleChange}
          />
        </label>

        <label>
          Active:
          <input
            type="checkbox"
            name="is_active"
            checked={settings.is_active}
            onChange={handleChange}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>

      {/* PREVIEW */}
      <div className="preview">
        <h3>🖼️ Live Preview</h3>
        <img src={settings.logo_url || "/placeholder-logo.png"} alt="Logo" />
        <h2>{settings.branch_name || "Branch Name"}</h2>
        <p>Scroll Speed: {settings.scroll_speed}</p>

        <div
          className="live-tv-scroll"
          style={{
            "--speed":
              settings.scroll_speed === "fast"
                ? "10s"
                : settings.scroll_speed === "slow"
                ? "30s"
                : "20s",
          } as React.CSSProperties}
        >
          <span>📺 RCEMS LIVE • Empowering Legacy • Spiritual Impact • Admin Dashboard •</span>
        </div>
      </div>
    </div>
  );
}
