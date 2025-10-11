"use client";
import React, { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { TabType } from "../usher/page";
import "./SajiliUshuhuda.css";

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

interface Props {
  setActiveTab?: React.Dispatch<React.SetStateAction<TabType>>;
}

interface WatuRow {
  id?: number;
  muumini_id?: number;
  muumini_namba?: string;
  majina?: string;
  jinsia?: string;
  simu?: string;
  mtaa?: string;
  kijiji?: string;
  kata?: string;
  wilaya?: string;
  jimbo?: string;
  eneo?: string;
  kanisa?: string;
  [key: string]: any;
}

export default function SajiliUshuhuda({ setActiveTab }: Props) {
  const [searchNamba, setSearchNamba] = useState("");
  const [searchMajina, setSearchMajina] = useState("");
  const [results, setResults] = useState<WatuRow[]>([]);
  const [selected, setSelected] = useState<WatuRow | null>(null);
  const [searching, setSearching] = useState(false);

  const [tarehe, setTarehe] = useState(new Date().toISOString().split("T")[0]);
  const [tatizo, setTatizo] = useState("");
  const [ushuhuda, setUshuhuda] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ===== LIVE SEARCH =====
  useEffect(() => {
    const timer = setTimeout(() => fetchWatu(), 400);
    return () => clearTimeout(timer);
  }, [searchNamba, searchMajina]);

  async function fetchWatu() {
    if (!searchNamba && !searchMajina) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      let query = supabase.from("watu").select("*").limit(100);
      if (searchNamba && searchMajina) {
        query = query.or(
          `muumini_namba.ilike.%${searchNamba}%,majina.ilike.%${searchMajina}%`
        );
      } else if (searchNamba) {
        query = query.ilike("muumini_namba", `%${searchNamba}%`);
      } else if (searchMajina) {
        query = query.ilike("majina", `%${searchMajina}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setResults((data as WatuRow[]) || []);
      setMessage("");
    } catch (err) {
      console.error("Search error:", err);
      setMessage("⚠️ Hitilafu wakati wa kutafuta muumini");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function chooseMuumini(m: WatuRow) {
    setSelected(m);
    setMessage("");
  }

  async function handleHifadhiUshuhuda() {
    if (!selected) return setMessage("⚠️ Chagua muumini kwanza");
    if (!ushuhuda.trim()) return setMessage("⚠️ Andika ushuhuda kabla ya kuhifadhi");

    setSubmitting(true);
    try {
      const payload = {
        muumini_id: selected.id ?? selected.muumini_id ?? null,
        muumini_namba: selected.muumini_namba ?? null,
        majina: selected.majina ?? null,
        tarehe,
        jina_mshuhudiaji: selected.majina ?? null,
        tatizo: tatizo.trim() || null,
        ushuhuda: ushuhuda.trim(),
        inserted_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("ushuhuda")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Insert ushuhuda error:", error);
        setMessage("⚠️ Hitilafu wakati wa kuhifadhi ushuhuda");
      } else {
        setMessage(`✅ Ushuhuda wa ${selected.majina} umehifadhiwa kwa mafanikio!`);
        setTatizo("");
        setUshuhuda("");
        setSelected(null);
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Hitilafu isiyotarajiwa wakati wa kuhifadhi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ushuhuda-container">
      <div className="ushuhuda-header">
        <h3>Sajili Ushuhuda</h3>
        <button
          className="btn-outline"
          onClick={() => setActiveTab && setActiveTab("home")}
        >
          🔙 Home
        </button>
      </div>

      <div className="search-bar">
        <input
          className="input"
          placeholder="Tafuta kwa Namba ya Muumini"
          value={searchNamba}
          onChange={(e) => setSearchNamba(e.target.value.replace(/\D/g, ""))}
        />
        <input
          className="input"
          placeholder="Tafuta kwa Majina"
          value={searchMajina}
          onChange={(e) => setSearchMajina(e.target.value)}
        />
        {searching && (
          <div className="progress-bar">
            <div className="progress"></div>
          </div>
        )}
      </div>

      <div className="results-section">
        {results.length === 0 ? (
          <div className="empty">Hakuna muumini waliopatikana</div>
        ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Namba</th>
                <th>Majina</th>
                <th>Chagua</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.id ?? i}>
                  <td>{i + 1}</td>
                  <td>{r.muumini_namba}</td>
                  <td>{r.majina}</td>
                  <td>
                    <button className="btn-small" onClick={() => chooseMuumini(r)}>
                      Chagua
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="ushuhuda-panel">
          <h4>
            Ushuhuda kwa:{" "}
            <span className="highlight">
              {selected.majina} ({selected.muumini_namba})
            </span>
          </h4>

          {/* --- Read-only Personal Details --- */}
          <div className="readonly-details">
            <p><strong>Namba:</strong> {selected.muumini_namba}</p>
            <p><strong>Majina:</strong> {selected.majina}</p>
            <p><strong>Jinsia:</strong> {selected.jinsia || "—"}</p>
            <p><strong>Simu:</strong> {selected.simu || "—"}</p>
            <p><strong>Mtaa:</strong> {selected.mtaa || "—"}</p>
            <p><strong>Kijiji:</strong> {selected.kijiji || "—"}</p>
            <p><strong>Kata:</strong> {selected.kata || "—"}</p>
            <p><strong>Wilaya:</strong> {selected.wilaya || "—"}</p>
            <p><strong>Jimbo:</strong> {selected.jimbo || "—"}</p>
            <p><strong>Eneo:</strong> {selected.eneo || "—"}</p>
            <p><strong>Kanisa:</strong> {selected.kanisa || "—"}</p>
          </div>

          <label>Tarehe ya Ushuhuda</label>
          <input
            className="input"
            type="date"
            value={tarehe}
            onChange={(e) => setTarehe(e.target.value)}
          />

          <label>Jina la Mshuhudiaji</label>
          <input
            className="input readonly"
            value={selected.majina ?? ""}
            readOnly
          />

          <label>Tatizo au Changamoto</label>
          <textarea
            className="textarea"
            value={tatizo}
            onChange={(e) => setTatizo(e.target.value)}
            placeholder="Tatizo/changamoto (optional)"
          />

          <label>Ushuhuda</label>
          <textarea
            className="textarea"
            value={ushuhuda}
            onChange={(e) => setUshuhuda(e.target.value)}
            placeholder="Andika ushuhuda hapa"
          />

          <div className="actions">
            <button
              className="btn-primary"
              onClick={handleHifadhiUshuhuda}
              disabled={submitting}
            >
              {submitting ? "Inahifadhi..." : "💾 Hifadhi Ushuhuda"}
            </button>
            <button
              className="btn-outline"
              onClick={() => setSelected(null)}
            >
              Ghairi
            </button>
          </div>
        </div>
      )}

      {message && <div className="message">{message}</div>}
    </div>
  );
}
