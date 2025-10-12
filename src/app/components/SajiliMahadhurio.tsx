"use client";

import { useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { TabType } from "../usher/page";

import "./SajiliMahadhurio.css";

// ---- Supabase setup ----
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// ---- Types ----
interface Mahadhurio {
  id?: number;
  aina: string;
  ibada?: string;
  tarehe: string;
  jinsi?: string;
  umbo?: string;
}

interface SajiliMahadhurioProps {
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

const SajiliMahadhurio: React.FC<SajiliMahadhurioProps> = ({ setActiveTab }) => {
  const [tarehe, setTarehe] = useState("");
  const [ainaMahadhurio, setAinaMahadhurio] = useState("");
  const [ainaIbada, setAinaIbada] = useState("");
  const [idadi, setIdadi] = useState(1);
  const [jinsi, setJinsi] = useState("");
  const [umbo, setUmbo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleWekaMahadhurio = async () => {
    if (!tarehe || !ainaMahadhurio || idadi < 1) {
      alert("Tafadhali jaza taarifa zote muhimu.");
      return;
    }

    setLoading(true);
    setMessage("");

    const records = Array.from({ length: idadi }, () => ({
      aina: ainaMahadhurio,
      ibada: ainaMahadhurio === "Ibada" ? ainaIbada : null,
      tarehe,
      jinsi: jinsi || null,
      umbo: umbo || null,
    }));

    const { error } = await supabase.from("mahadhurio").insert(records);

    if (error) {
      setMessage("❌ Hitilafu: " + error.message);
    } else {
      setMessage(`✅ Mahadhurio ${idadi} yamerekodiwa kwa tarehe ${tarehe}.`);
      // Optionally reset form:
      setIdadi(1);
      setJinsi("");
      setUmbo("");
      setAinaMahadhurio("");
      setAinaIbada("");
      setTarehe("");
    }

    setLoading(false);
  };

  return (
    <div className="wrapper">
      <h2 className="heading">Sajili Mahadhurio</h2>

      <div className="section">
        <label className="label">Idadi ya Watu</label>
        <input
          className="input"
          type="number"
          min={1}
          value={idadi}
          onChange={(e) => setIdadi(Number(e.target.value))}
        />

        <label className="label">Jinsi</label>
        <select className="select" value={jinsi} onChange={(e) => setJinsi(e.target.value)}>
          <option value="">Chagua</option>
          <option value="Me">Me</option>
          <option value="Ke">Ke</option>
          <option value="Watoto">Watoto</option>
        </select>

        <label className="label">Umbo</label>
        <select className="select" value={umbo} onChange={(e) => setUmbo(e.target.value)}>
          <option value="">Chagua</option>
          <option value="Mwanafunzi">Mtoto</option>
          <option value="Mtu Mzima">Mtu Mzima</option>
          <option value="Kijana">Kijana</option>
        </select>

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

      <div className="spiritual-banner">
        🕊️ “Kila mahadhurio ni ushuhuda wa uaminifu.” – RHEMA OUTREACH CHURCH TANZANIA
      </div>
    </div>
  );
};

export default SajiliMahadhurio;
