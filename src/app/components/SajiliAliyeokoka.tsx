"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import type { TabType } from "../usher/page";

  import "./SajiliAliyeokoka.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SajiliAliyeokokaProps {
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

interface Muumini {
  id: number;
  muumini_namba: string;
  majina: string;
  simu?: string;
  jinsia?: string;
  mahali_anapotokea?: string;
  kundi_la_mtu_mzima?: string;
}

const SajiliAliyeokoka: React.FC<SajiliAliyeokokaProps> = ({ setActiveTab }) => {
  const [searchNamba, setSearchNamba] = useState("");
  const [searchMajina, setSearchMajina] = useState("");
  const [searchResults, setSearchResults] = useState<Muumini[]>([]);
  const [selectedMuumini, setSelectedMuumini] = useState<Muumini | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const handleSearch = async () => {
    if (!searchNamba && !searchMajina) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    let query = supabase.from("watu").select("*");

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

    if (error) {
      console.error("Search error:", error);
      setMessage("Hitilafu wakati wa kutafuta");
      setSearchResults([]);
    } else {
      setSearchResults((data as Muumini[]) || []);
    }

    setSearching(false);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      handleSearch();
    }, 400);
    return () => clearTimeout(delay);
  }, [searchNamba, searchMajina]);

  const handleSelectMuumini = (muu: Muumini) => {
    setSelectedMuumini(muu);
    setShowDialog(true);
    setMessage("");
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedMuumini(null);
  };

  const handleSajiliWokovu = async () => {
    if (!selectedMuumini) return;
    setLoading(true);

    const tareheLeo = new Date().toISOString().split("T")[0];

    const { data: existing, error: checkError } = await supabase
      .from("wokovu")
      .select("*")
      .eq("muumini_id", selectedMuumini.id);

    if (checkError) {
      setMessage("Hitilafu wakati wa kuhakiki wokovu");
      setLoading(false);
      return;
    }

    if (existing && existing.length > 0) {
      setMessage(
        "⚠️ Muumini huyu ameshasajiliwa wokovu. Kuokoka ni mara moja 🙏"
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("wokovu").insert([
      {
        muumini_id: selectedMuumini.id,
        muumini_namba: selectedMuumini.muumini_namba,
        majina: selectedMuumini.majina,
        tarehe: tareheLeo,
      },
    ]);

    if (error) {
      setMessage("Hitilafu: " + error.message);
    } else {
      setMessage(`✅ Wokovu umesajiliwa kwa ${selectedMuumini.majina}`);
      setTimeout(() => setActiveTab("home"), 2000);
    }

    setLoading(false);
  };

  return (
    <div className="wrapper">
      <h2 className="heading">Sajili Aliyeokoka</h2>

      <div className="search-section">
        <input
          className="input"
          placeholder="Muumini Namba"
          value={searchNamba}
          onChange={(e) => setSearchNamba(e.target.value.replace(/\D/g, ""))}
        />
        <input
          className="input"
          placeholder="Majina (optional)"
          value={searchMajina}
          onChange={(e) => setSearchMajina(e.target.value)}
        />

        {searching && (
          <div className="progress-bar">
            <div className="progress"></div>
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="results-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Namba</th>
                <th>Majina</th>
                <th>Chagua</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((muu, index) => (
                <tr key={muu.id}>
                  <td>{index + 1}</td>
                  <td>{muu.muumini_namba}</td>
                  <td>{muu.majina}</td>
                  <td>
                    <button
                      className="select-btn"
                      onClick={() => handleSelectMuumini(muu)}
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

      {showDialog && selectedMuumini && (
        <div className="dialog-overlay" onClick={handleCloseDialog}>
          <div
            className="dialog"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <h3>Taarifa za Muumini</h3>
            <div className="dialog-content">
              <p><strong>Namba:</strong> {selectedMuumini.muumini_namba}</p>
              <p><strong>Majina:</strong> {selectedMuumini.majina}</p>
              <p><strong>Simu:</strong> {selectedMuumini.simu || "—"}</p>
              <p><strong>Jinsia:</strong> {selectedMuumini.jinsia || "—"}</p>
              <p>
                <strong>Mahali Anapotokea:</strong>{" "}
                {selectedMuumini.mahali_anapotokea || "—"}
              </p>
              <p>
                <strong>Kundi:</strong>{" "}
                {selectedMuumini.kundi_la_mtu_mzima || "—"}
              </p>
            </div>
            <div className="dialog-actions">
              <button
                className="confirm-btn"
                onClick={handleSajiliWokovu}
                disabled={loading}
              >
                {loading ? "Inasajili..." : "Sajili Wokovu"}
              </button>
              <button className="close-btn" onClick={handleCloseDialog}>
                Funga
              </button>
            </div>
            {message && <p className="dialog-message">{message}</p>}
          </div>
        </div>
      )}

      {message && !showDialog && <p className="message">{message}</p>}
    </div>
  );
};

export default SajiliAliyeokoka;
