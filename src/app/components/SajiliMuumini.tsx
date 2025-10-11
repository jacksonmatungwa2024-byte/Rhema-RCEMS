"use client";

import { useState, ChangeEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import "./SajiliMuumini.css";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const SajiliMuumini: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [majina, setMajina] = useState("");
  const [simu, setSimu] = useState("");
  const [jinsi, setJinsi] = useState<"me" | "ke">("me");
  const [umbo, setUmbo] = useState<"mtoto" | "mtu mzima">("mtoto");
  const [kundiLaMtuMzima, setKundiLaMtuMzima] = useState<
    "kijana" | "mzee" | "zaidi ya kijana" | ""
  >("");
  const [mahali, setMahali] = useState("");
  const [bahasha, setBahasha] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [overlay, setOverlay] = useState("");

  const handleOpenForm = () => {
    setShowForm(true);
    setMessage("");
    setOverlay("");
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setMessage("");
    setOverlay("");
  };

 const handleSajili = async () => {
  if (!majina.trim()) {
    setMessage("❌ Tafadhali jaza majina.");
    return;
  }
  if (!mahali.trim()) {
    setMessage("❌ Tafadhali jaza mahali anapotokea.");
    return;
  }

  setLoading(true);
  try {
    const { data, error } = await supabase
      .from("watu")
      .insert([
        {
          majina,
          simu: simu || null,
          jinsi,
          umbo,
          kundi_la_mtu_mzima: umbo === "mtu mzima" ? kundiLaMtuMzima || null : null,
          mahali_anapotokea: mahali,
          bahasha: bahasha || null,
          created_at: new Date(), // <-- Add this line
        },
      ])
      .select();

    if (error) {
      setMessage("❌ Hitilafu: " + error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setMessage("❌ Hakuna data iliyoingizwa.");
      setLoading(false);
      return;
    }

    const insertedId = data[0].id;
    const muuminiNamba = `RHEMA${("000" + insertedId).slice(-3)}`;

    const { data: existing } = await supabase
      .from("watu")
      .select("id")
      .eq("muumini_namba", muuminiNamba);

    if (existing && existing.length > 0) {
      setMessage(`⚠️ Namba ${muuminiNamba} tayari ipo. Tafadhali jaribu tena.`);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("watu")
      .update({ muumini_namba: muuminiNamba })
      .eq("id", insertedId);

    if (updateError) {
      setMessage("❌ Hitilafu wakati wa update: " + updateError.message);
    } else {
      setMessage(`✅ ${majina} amesajiliwa kama muumini mpya.\nNamba yake ni ${muuminiNamba}`);
      setOverlay(`“Umeandikwa katika kumbukumbu ya walioitwa kwa jina la Bwana.” – RHEMA Legacy Registry`);
    }

    setShowForm(false);
    setMajina("");
    setSimu("");
    setJinsi("me");
    setUmbo("mtoto");
    setKundiLaMtuMzima("");
    setMahali("");
    setBahasha("");
  } catch (error) {
    setMessage("❌ Hitilafu isiyotarajiwa: " + (error as Error).message);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="sajili-wrapper">
      {!showForm && (
        <button onClick={handleOpenForm} className="btn btn-open">
          Sajili Muumini
        </button>
      )}

      {showForm && (
        <form
          className="sajili-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSajili();
          }}
          noValidate
        >
          <h3 className="form-title">Jaza taarifa za Muumini</h3>

          <label htmlFor="majina" className="form-label">
            Majina:
          </label>
          <input
            id="majina"
            type="text"
            value={majina}
            onChange={(e) => setMajina(e.target.value)}
            className="form-input"
            required
            placeholder="Ingiza majina kamili"
          />

          <label htmlFor="simu" className="form-label">
            Namba ya simu (optional):
          </label>
          <input
            id="simu"
            type="tel"
            value={simu}
            onChange={(e) => setSimu(e.target.value)}
            className="form-input"
            placeholder="07xxxxxxxx"
          />

          <label htmlFor="mahali" className="form-label">
            Mahali anapotokea:
          </label>
          <input
            id="mahali"
            type="text"
            value={mahali}
            onChange={(e) => setMahali(e.target.value)}
            className="form-input"
            placeholder="Mfano: Arusha, Mwanza..."
            required
          />

          <label htmlFor="jinsi" className="form-label">
            Jinsi:
          </label>
          <select
            id="jinsi"
            value={jinsi}
            onChange={(e) => setJinsi(e.target.value as "me" | "ke")}
            className="form-select"
          >
            <option value="me">Me</option>
            <option value="ke">Ke</option>
          </select>

          <label htmlFor="umbo" className="form-label">
            Umbo (Mtoto/Mtu Mzima):
          </label>
          <select
            id="umbo"
            value={umbo}
            onChange={(e) => setUmbo(e.target.value as "mtoto" | "mtu mzima")}
            className="form-select"
          >
            <option value="mtoto">Mtoto</option>
            <option value="mtu mzima">Mtu Mzima</option>
          </select>

          {umbo === "mtu mzima" && (
            <>
              <label htmlFor="kundi" className="form-label">
                Kundi la mtu mzima:
              </label>
              <select
                id="kundi"
                value={kundiLaMtuMzima}
                onChange={(e) =>
                  setKundiLaMtuMzima(
                    e.target.value as "kijana" | "mzee" | "zaidi ya kijana" | ""
                  )
                }
                className="form-select"
                required
              >
                <option value="">-- Chagua Kundi --</option>
                <option value="kijana">Kijana</option>
                <option value="mzee">Mzee</option>
                <option value="zaidi ya kijana">Zaidi ya Kijana</option>
              </select>
            </>
          )}

          <label htmlFor="bahasha" className="form-label">
            No ya Bahasha ya Ujenzi (optional):
          </label>
          <input
            id="bahasha"
            type="text"
            value={bahasha}
            onChange={(e) => setBahasha(e.target.value)}
            className="form-input"
            placeholder="Namba ya bahasha"
          />

          <div className="button-row">
            <button type="submit" disabled={loading} className="btn btn-submit">
              {loading ? "Inashughulikiwa..." : "Sajili"}
            </button>
            <button type="button" onClick={handleCloseForm} className="btn btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      )}

      {message && <p className={`message ${message.startsWith("❌") ? "error" : "success"}`}>{message}</p>}
      {overlay && <p className="overlay-text">{overlay}</p>}
    </div>
  );
};

export default SajiliMuumini;
