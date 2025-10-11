"use client";

import { useState, useEffect } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { TabType } from "../usher/page";

  import "./SajiliMahadhurio.css";

// ---- Supabase setup ----
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// ---- Types ----
interface Muumini {
  id: number;
  majina: string;
  muumini_namba: string;
  simu?: string;
  jinsi?: string;
  mahali_anapotokea?: string;
  umbo?: string;
  kundi_la_mtu_mzima?: string;
  bahasha?: string;
}

interface Mahadhurio {
  id?: number;
  muumini_id: number;
  muumini_namba: string;
  majina: string;
  aina: string;
  ibada?: string;
  tarehe: string;
}

interface SajiliMahadhurioProps {
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

const SajiliMahadhurio: React.FC<SajiliMahadhurioProps> = ({ setActiveTab }) => {
  const [searchNamba, setSearchNamba] = useState("");
  const [searchMajina, setSearchMajina] = useState("");
  const [searchResults, setSearchResults] = useState<Muumini[]>([]);
  const [selectedMuumini, setSelectedMuumini] = useState<Muumini | null>(null);

  const [ainaMahadhurio, setAinaMahadhurio] = useState("");
  const [ainaIbada, setAinaIbada] = useState("");
  const [tarehe, setTarehe] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [mahadhurioList, setMahadhurioList] = useState<Mahadhurio[]>([]);

  // ---- Search handler ----
  const handleSearch = async (namba: string, majina: string) => {
    setSearching(true);
    const { data, error } = await supabase
      .from("watu")
      .select("*")
      .or(`muumini_namba.ilike.%${namba}%,majina.ilike.%${majina}%`);

    if (error) console.error(error);
    setSearchResults((data as Muumini[]) ?? []);
    setSearching(false);
  };

  // ---- Handle selecting a muumini ----
  const handleSelectMuumini = (muu: Muumini) => {
    setSelectedMuumini(muu);
    setMessage("");
  };

  // ---- Handle inserting mahadhurio ----
  const handleWekaMahadhurio = async () => {
    if (!selectedMuumini || !tarehe || !ainaMahadhurio) {
      alert("Tafadhali jaza taarifa zote");
      return;
    }

    setLoading(true);

    // Check existing records for this date
    const { data: existing, error } = await supabase
      .from("mahadhurio")
      .select("*")
      .eq("muumini_id", selectedMuumini.id)
      .eq("tarehe", tarehe);

    if (error) {
      setMessage("❌ Hitilafu wakati wa kusoma data: " + error.message);
      setLoading(false);
      return;
    }

    const records = existing as Mahadhurio[];
    const count = records.length;

    if (count >= 3) {
      setMessage("⚠️ Kafika ukomo wa mahadhurio kwa siku hii (mara 3).");
      // Fetch full attendance list to show in modal
      setMahadhurioList(records);
      setShowModal(true);
      setLoading(false);
      return;
    }

    const remaining = 3 - (count + 1);
    const { error: insertError } = await supabase.from("mahadhurio").insert([
      {
        muumini_id: selectedMuumini.id,
        muumini_namba: selectedMuumini.muumini_namba,
        majina: selectedMuumini.majina,
        aina: ainaMahadhurio,
        ibada: ainaIbada,
        tarehe,
      },
    ]);

    if (insertError) {
      setMessage("❌ Hitilafu: " + insertError.message);
    } else {
      setMessage(
        `✅ Mahadhurio yamerekodiwa kwa ${selectedMuumini.majina}. Amebakiza ${remaining} kwa siku hii.`
      );
    }

    setLoading(false);
  };

  // ---- Render ----
  return (
    <div className="wrapper">
      <h2 className="heading">Sajili Mahadhurio</h2>

      {/* Search Section */}
      <div className="section">
        <h4 className="section-title">Tafuta Muumini kwa Namba au Majina</h4>
        <div className="search-inputs">
          <input
            className="input"
            placeholder="Namba ya Muumini"
            value={searchNamba}
            onChange={(e) => {
              const val = e.target.value;
              setSearchNamba(val);
              handleSearch(val, searchMajina);
            }}
          />
          <input
            className="input"
            placeholder="Majina kamili"
            value={searchMajina}
            onChange={(e) => {
              const val = e.target.value;
              setSearchMajina(val);
              handleSearch(searchNamba, val);
            }}
          />
        </div>

        {searching && (
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        )}
      </div>

      {/* Results Table */}
      {searchResults.length > 0 && (
        <div className="results">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Namba</th>
                <th>Majina</th>
                <th>Chagua</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((m, i) => (
                <tr key={m.id}>
                  <td>{i + 1}</td>
                  <td>{m.muumini_namba}</td>
                  <td>{m.majina}</td>
                  <td>
                    <button
                      className="btn"
                      onClick={() => handleSelectMuumini(m)}
                    >
                      Chagua
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance Form */}
      {selectedMuumini && (
        <div className="section">
          <h4 className="section-title">Taarifa za Muumini</h4>

          <div className="readonly-details">
            <p><strong>Jina:</strong> {selectedMuumini.majina}</p>
            <p><strong>Namba:</strong> {selectedMuumini.muumini_namba}</p>
            <p><strong>Simu:</strong> {selectedMuumini.simu || "-"}</p>
            <p><strong>Mahali:</strong> {selectedMuumini.mahali_anapotokea || "-"}</p>
            <p><strong>Umbo:</strong> {selectedMuumini.umbo || "-"}</p>
            <p><strong>Kundi:</strong> {selectedMuumini.kundi_la_mtu_mzima || "-"}</p>
          </div>

          <label className="label">Aina ya Mahadhurio</label>
          <select
            className="select"
            value={ainaMahadhurio}
            onChange={(e) => setAinaMahadhurio(e.target.value)}
          >
            <option value="">Chagua</option>
            <option value="Ibada">Ibada</option>
            <option value="Kikao">Kikao</option>
            <option value="Sherehe">Sherehe</option>
          </select>

          {ainaMahadhurio === "Ibada" && (
            <>
              <label className="label">Aina ya Ibada</label>
              <select
                className="select"
                value={ainaIbada}
                onChange={(e) => setAinaIbada(e.target.value)}
              >
                <option value="">Chagua</option>
                <option value="IBADA YA KWANZA">IBADA YA KWANZA</option>
                <option value="IBADA YA PILI">IBADA YA PILI</option>
                <option value="IBADA YA MAJIBU">IBADA YA MAJIBU</option>
                <option value="MAOMBI YA KUFUNGA VIJANA">MAOMBI YA KUFUNGA VIJANA</option>
                <option value="MAOMBI YA KUFUNGA WANAUME">MAOMBI YA KUFUNGA WANAUME</option>
                <option value="MAOMBI YA KUFUNGA VIJANA">MAOMBI YA KUFUNGA VIJANA</option>
                <option value="MAOMBI YA KUFUNGA WANAWAKE">MAOMBI YA KUFUNGA WANAWAKE</option>
                <option value="IBADA YA MKESHA WA VIJANA">IBADA YA MKESHA WA VIJANA</option>
                <option value="IBADA YA WATOTO">IBADA YA WATOTO</option>
                <option value="IBADA YA VIJANA">IBADA YA KIJANA</option>
                <option value="IBADA YA WANAWAKE">IBADA YA WANAWAKE</option>
                <option value="IBADA YA WANAUME">IBADA YA WANAUME</option>
                <option value="IBADA YA LADIES OF DESTINY">IBADA YA LADIES OF DESTINY</option>
                <option value="IBADA YA WAFANYABIASHARA">IBADA YA WAFANYABIASHARA</option>
                <option value="IBADA YA WANAFUNZI">IBADA YA WANAFUNZI</option>
                <option value="IBADA YA HARUSI">IBADA YA HARUSI</option>
                <option value="INGINE">INGINE</option>
                
              </select>
            </>
          )}

          <label className="label">Tarehe</label>
          <input
            className="input"
            type="date"
            value={tarehe}
            onChange={(e) => setTarehe(e.target.value)}
          />

          <button className="btn primary" onClick={handleWekaMahadhurio} disabled={loading}>
            {loading ? "Inashughulikiwa..." : "Weka Mahadhurio"}
          </button>

          {message && <p className="message">{message}</p>}
        </div>
      )}
<div className="spiritual-banner">
  🕊️ “Kila mahadhurio ni ushuhuda wa uaminifu.” – RHEMA OUTREACH CHURCH TANZANIA
</div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Ukomo wa Mahadhurio</h3>
            <p>
              {selectedMuumini?.majina} ({selectedMuumini?.muumini_namba}) amefika
              ukomo wa mahadhurio kwa siku hii.
            </p>

            <h4>Rekodi za Leo:</h4>
            <ul>
              {mahadhurioList.map((m) => (
                <li key={m.id}>
                  {m.aina} - {m.ibada || "N/A"}
                </li>
              ))}
            </ul>

            <button className="btn close" onClick={() => setShowModal(false)}>
              Funga
            </button>
           

          </div>
        </div>
      )}
    </div>
  );
};

export default SajiliMahadhurio;
