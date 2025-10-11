"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { pdf } from "@react-pdf/renderer";
import { ReceiptPDF, shareReceiptViaWhatsApp } from "../components/ReceiptPDF";

import "./MchangoForm.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MchangoForm() {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMuumini, setSelectedMuumini] = useState<any | null>(null);
  const [existingMchango, setExistingMchango] = useState<any | null>(null);
  const [headerLine, setHeaderLine] = useState(
    "Basi iweni na akili mkeshe katika sala – 1 Petro 4:7"
  );
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({
    majina: "",
    simu: "",
    mahali: "",
    mchango_type: "",
    target: "",
    kiasi_pangwa: 50000, // default kwa wanaoanza
    kiasi_lipwa: 0,
    kiasi_punguzo: 0,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Load header line (finance anaweza ku-edit)
  useEffect(() => {
    async function loadHeader() {
      const { data } = await supabase
        .from("settings")
        .select("receipt_header")
        .eq("id", 1)
        .single();
      if (data?.receipt_header) setHeaderLine(data.receipt_header);
    }
    loadHeader();
  }, []);

  // 🔹 Tafuta majina
  useEffect(() => {
    if (search.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => searchMajina(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function searchMajina(query: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("watu")
      .select("*")
      .ilike("majina", `%${query}%`)
      .limit(10);
    setLoading(false);
    if (!error) setSuggestions(data || []);
  }

  // 🔹 Angalia kama ana mchango unaoendelea
  async function checkExistingMchango(muumini_namba: string) {
    const { data } = await supabase
      .from("michango_entries")
      .select("*")
      .eq("muumini_namba", muumini_namba)
      .neq("kiasi_bado", 0)
      .order("created_at", { ascending: false })
      .limit(1);
    return data?.length ? data[0] : null;
  }

  // 🔹 Chagua muumini
  async function handleChoose(muumini: any) {
    setSelectedMuumini(muumini);
    setSearch("");
    setSuggestions([]);

    const existing = await checkExistingMchango(muumini.muumini_namba);
    if (existing) {
      setExistingMchango(existing);
      setMessage("⚠️ Muumini huyu bado ana mchango unaoendelea!");
      setForm({
        majina: existing.majina,
        simu: existing.simu || "",
        mahali: existing.mahali || "",
        mchango_type: existing.mchango_type,
        target: existing.target || "",
        kiasi_pangwa: existing.kiasi_pangwa, // fixed
        kiasi_lipwa: 0,
        kiasi_punguzo: existing.kiasi_punguzo || 0,
      });
    } else {
      setExistingMchango(null);
      setMessage("");
      setForm({
        majina: muumini.majina,
        simu: muumini.simu ?? "",
        mahali: "",
        mchango_type: "",
        target: "",
        kiasi_pangwa: 0, // Finance ataweka kwa wanaoanza tu
        kiasi_lipwa: 0,
        kiasi_punguzo: 0,
      });
    }
  }

  // 🔹 Hesabu kiasi kilichobaki
  function calculateRemaining() {
    return Math.max(
      0,
      form.kiasi_pangwa - (form.kiasi_lipwa + form.kiasi_punguzo)
    );
  }

  // 🔹 Print risiti
  async function autoPrintReceipt(data: any) {
    const blob = await pdf(<ReceiptPDF data={data} headerLine={headerLine} />).toBlob();
    const url = URL.createObjectURL(blob);
    const win = window.open(url);
    if (win) win.print();
  }

  // 🔹 Hifadhi na tuma risiti WhatsApp
  async function confirmSave() {
    if (!selectedMuumini) return;
    const kiasi_bado = calculateRemaining();
    let savedData = null;

    if (existingMchango) {
      // Muumini anaendelea na mchango uleule (fixed kiasi_pangwa)
      const new_paid = existingMchango.kiasi_lipwa + form.kiasi_lipwa;
      const new_remaining =
        existingMchango.kiasi_pangwa - (new_paid + existingMchango.kiasi_punguzo);

      const { data } = await supabase
        .from("michango_entries")
        .update({
          kiasi_lipwa: new_paid,
          kiasi_bado: new_remaining > 0 ? new_remaining : 0,
        })
        .eq("id", existingMchango.id)
        .select()
        .single();

      savedData = data;
      setMessage("✅ Malipo yameongezwa kwenye mchango uliopo!");
    } else {
      // Mchango mpya (finance anaweka kiasi_pangwa)
      if (form.kiasi_pangwa <= 0) {
        setMessage("⚠️ Tafadhali weka kiwango cha mchango kilichopangwa (kiasi_pangwa).");
        return;
      }

      const { data, error } = await supabase
        .from("michango_entries")
        .insert({
          ...form,
          muumini_namba: selectedMuumini.muumini_namba,
          kiasi_bado,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) setMessage("⚠️ Hitilafu wakati wa kuhifadhi mchango mpya.");
      else {
        savedData = data;
        setMessage("✅ Mchango mpya umehifadhiwa kikamilifu!");
      }
    }

    // Baada ya kuhifadhi, toa risiti na tuma WhatsApp
    if (savedData) {
      await autoPrintReceipt(savedData);
      await shareReceiptViaWhatsApp(savedData, headerLine);
    }

    setExistingMchango(null);
    setSelectedMuumini(null);
    setShowPreview(false);
  }

  return (
    <div className="mchango-container">
      <h2>🙏 Mfumo wa Michango</h2>

      {/* 🔍 Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedMuumini(null);
        }}
        placeholder="Tafuta kwa majina ya muumini..."
        className="search-input"
      />

      {loading && <div>🔎 Inatafuta...</div>}

      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((s) => (
            <li key={s.id} onClick={() => handleChoose(s)}>
              {s.majina} {s.simu && `(${s.simu})`}
            </li>
          ))}
        </ul>
      )}

      {selectedMuumini && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowPreview(true);
          }}
          className="form-grid"
        >
          <label>
            Majina
            <input type="text" value={form.majina} readOnly />
          </label>

          <label>
            Simu
            <input
              type="text"
              value={form.simu}
              onChange={(e) => setForm({ ...form, simu: e.target.value })}
            />
          </label>

          <label>
            Aina ya Mchango
            <input
              type="text"
              value={form.mchango_type}
              readOnly={!!existingMchango}
              onChange={(e) =>
                setForm({ ...form, mchango_type: e.target.value })
              }
              placeholder={
                existingMchango
                  ? "Mchango unaoendelea"
                  : "Andika aina ya mchango mpya..."
              }
            />
          </label>

          {!existingMchango && (
            <label>
              Kiasi Kilichopangwa (TZS)
              <input
                type="number"
                value={form.kiasi_pangwa}
                onChange={(e) =>
                  setForm({
                    ...form,
                    kiasi_pangwa: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Weka kiasi cha mchango kipya"
              />
            </label>
          )}

          <label>
            Kiasi Kilicholipwa (TZS)
            <input
              type="number"
              value={form.kiasi_lipwa}
              onChange={(e) =>
                setForm({
                  ...form,
                  kiasi_lipwa: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
          </label>

          <div>
            <strong>Bado:</strong> {calculateRemaining().toLocaleString()} TZS
          </div>

          {existingMchango && (
            <p className="alert">
              ⚠️ Anaendelea na mchango wa{" "}
              <b>{existingMchango.mchango_type}</b> — bado{" "}
              {existingMchango.kiasi_bado.toLocaleString()} TZS.
              <br />
              👉 Huwezi kuanzisha mchango mpya mpaka amalize huu.
            </p>
          )}

          <button type="submit">✅ Angalia Preview</button>
        </form>
      )}

      {/* 🔹 Dialog ya uthibitisho */}
      {showPreview && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>📄 Thibitisha Taarifa</h3>
            <p><b>Jina:</b> {form.majina}</p>
            <p><b>Mchango:</b> {form.mchango_type}</p>
            <p><b>Kiasi:</b> {form.kiasi_lipwa.toLocaleString()} TZS</p>
            <p><b>Bado:</b> {calculateRemaining().toLocaleString()} TZS</p>
            <div className="dialog-buttons">
              <button onClick={confirmSave}>💾 Hifadhi & Tuma WhatsApp</button>
              <button
                onClick={() => setShowPreview(false)}
                className="cancel-btn"
              >
                ❌ Futa
              </button>
            </div>
          </div>
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
}
