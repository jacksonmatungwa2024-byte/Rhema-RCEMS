"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SetActiveTab } from "@/types/tabs";
import styles from "./ReportsDashboard.module.css";

interface ReportsDashboardProps {
  setActiveTab: SetActiveTab;
}

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Row = Record<string, any>;

export default function ReportsDashboard({ setActiveTab }: ReportsDashboardProps) {
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState({
    wokovu: 0,
    watu: 0,
    ushuhuda: 0,
    mafunzo: 0,
    mahadhurio: 0,
  });
  const [rows, setRows] = useState<{ [k: string]: Row[] }>({
    wokovu: [],
    watu: [],
    ushuhuda: [],
    mafunzo: [],
    mahadhurio: [],
  });
  const [mahadhurioJinsi, setMahadhurioJinsi] = useState<Row[]>([]);
  const [mahadhurioIbada, setMahadhurioIbada] = useState<Row[]>([]);
  const [activeGroup, setActiveGroup] = useState<keyof typeof rows>("wokovu");
  const [autoRefreshOn, setAutoRefreshOn] = useState<boolean>(true);
  const refreshTimer = useRef<number | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadAll();
    if (autoRefreshOn) startAutoRefresh();
    return () => stopAutoRefresh();
  }, [date, autoRefreshOn]);

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer.current = window.setInterval(() => loadAll(), 2 * 60 * 1000);
  }

  function stopAutoRefresh() {
    if (refreshTimer.current) {
      window.clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
  }

  function getDateFilter(query: any, dateStr: string, field = "tarehe") {
    if (!dateStr) return query;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return query.eq(field, dateStr);
    } else if (/^\d{4}-\d{2}$/.test(dateStr) || /^\d{4}$/.test(dateStr)) {
      return query.like(field, `${dateStr}-%`);
    }
    return query;
  }

  function getDistinctByUser(data: Row[]) {
    return Array.from(new Map(data.map((d) => [d.muumini_namba ?? d.majina, d])).values());
  }

  async function loadAll() {
  setLoading(true);
  try {
    const newRows: typeof rows = {
      wokovu: [],
      watu: [],
      ushuhuda: [],
      mafunzo: [],
      mahadhurio: [],
    };

    // === Wokovu ===
    {
      let q = supabase.from("wokovu").select("*").order("tarehe", { ascending: false }).limit(1000);
      q = getDateFilter(q, date, "tarehe");
      const { data, error } = await q;
      if (error) throw error;
      newRows.wokovu = getDistinctByUser(data ?? []);
    }

    // === Watu ===
    {
      let q = supabase.from("watu").select("*").order("created_at", { ascending: false }).limit(1000);
      if (date) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          q = q.gte("created_at", `${date}T00:00:00`).lt("created_at", `${date}T23:59:59`);
        } else {
          q = q.like("created_at", `${date}-%`);
        }
      }
      const { data, error } = await q;
      if (error) throw error;
      newRows.watu = getDistinctByUser(data ?? []);
    }

    // === Ushuhuda ===
    {
      let q = supabase.from("ushuhuda").select("*").order("tarehe", { ascending: false }).limit(2000);
      q = getDateFilter(q, date, "tarehe");
      const { data, error } = await q;
      if (error) throw error;
      newRows.ushuhuda = getDistinctByUser(data ?? []);
    }

    // === Mafunzo ===
    {
      let q = supabase.from("mafunzo").select("*").order("tarehe", { ascending: false }).limit(3000);
      q = getDateFilter(q, date, "tarehe");
      const { data, error } = await q;
      if (error) throw error;
      newRows.mafunzo = getDistinctByUser(data ?? []);
    }

    // === ✅ Mahadhurio Breakdown kwa Jinsi & Ibada ===
    {
      let q = supabase.from("mahadhurio").select("jinsi, ibada, id, tarehe");
      q = getDateFilter(q, date, "tarehe");
      const { data, error } = await q;
      if (error) throw error;

      const allMahadhurio = data ?? [];

      // group kwa jinsi & ibada
      const jinsiMap: Record<string, number> = {};
      const ibadaMap: Record<string, number> = {};

      for (const row of allMahadhurio) {
        const jins = row.jinsi || "Haijatajwa";
        const iba = row.ibada || "Haijatajwa";
        jinsiMap[jins] = (jinsiMap[jins] || 0) + 1;
        ibadaMap[iba] = (ibadaMap[iba] || 0) + 1;
      }

      const jinsiData = Object.entries(jinsiMap).map(([jinsi, count]) => ({ jinsi, count }));
      const ibadaData = Object.entries(ibadaMap).map(([ibada, count]) => ({ ibada, count }));

      setMahadhurioJinsi(jinsiData);
      setMahadhurioIbada(ibadaData);

      const totalMahadhurio = jinsiData.reduce(
        (sum: number, r: any) => sum + (r.count || 0),
        0
      );

      newRows.mahadhurio = allMahadhurio;

      // === Update summary ===
      setRows(newRows);
      setSummary({
        wokovu: newRows.wokovu.length,
        watu: newRows.watu.length,
        ushuhuda: newRows.ushuhuda.length,
        mafunzo: newRows.mafunzo.length,
        mahadhurio: totalMahadhurio,
      });
    }
  } catch (err) {
    console.error("LoadAll error:", err instanceof Error ? err.message : err);
  } finally {
    setLoading(false);
  }
}



  function MiniBarChart({ value, max = 100 }: { value: number; max?: number }) {
    const pct = max === 0 ? 0 : Math.min(100, Math.round((value / Math.max(1, max)) * 100));
    const w = Math.max(40, Math.round((pct / 100) * 240));
    return (
      <svg width="260" height="36">
        <rect x={0} y={8} width={260} height={20} rx={10} fill="#efe9f6" />
        <rect x={0} y={8} width={w} height={20} rx={10} fill="url(#g1)" />
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#6a1b9a" />
            <stop offset="100%" stopColor="#9c27b0" />
          </linearGradient>
        </defs>
        <text x={8} y={24} fontSize={12} fill="#fff" fontWeight={700}>
          {value}
        </text>
      </svg>
    );
  }

  const maxSummary = Math.max(
    1,
    summary.wokovu,
    summary.watu,
    summary.ushuhuda,
    summary.mafunzo,
    summary.mahadhurio
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h3 className={styles.title}>Reports Dashboard</h3>
        <div className={styles.controls}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.input}
          />
          <button onClick={loadAll} className={styles.runBtn}>
            {loading ? "Loading..." : "Run"}
          </button>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={autoRefreshOn}
              onChange={(e) => setAutoRefreshOn(e.target.checked)}
            />
            Auto-refresh 2m
          </label>
        </div>
      </div>

      <div ref={printRef} className={styles.printArea}>
        <div className={styles.summaryCard}>
          {[
            { label: "Waliyookoka", value: summary.wokovu },
            { label: "Waliosajiliwa", value: summary.watu },
            { label: "Walioshuhudia", value: summary.ushuhuda },
            { label: "Mafunzo", value: summary.mafunzo },
            { label: "Mahadhurio (Jumla)", value: summary.mahadhurio },
          ].map((item, index) => (
            <div key={index} className={styles.barChart}>
              <div>{item.label}</div>
              <div>{item.value}</div>
              <MiniBarChart value={item.value} max={maxSummary} />
            </div>
          ))}

          {/* Breakdown kwa jinsi */}
          {mahadhurioJinsi.length > 0 && (
            <div className={styles.subBreakdown}>
              <h4>📊 Mahadhurio kwa Jinsi</h4>
              {mahadhurioJinsi.map((r) => (
                <div key={r.jinsi}>
                  {r.jinsi || "Haijatajwa"}: {r.count}
                </div>
              ))}
            </div>
          )}

          {/* Breakdown kwa Ibada/Sherehe */}
          {mahadhurioIbada.length > 0 && (
            <div className={styles.subBreakdown}>
              <h4>⛪ Mahadhurio kwa Ibada / Sherehe</h4>
              {mahadhurioIbada.map((r) => (
                <div key={r.ibada}>
                  {r.ibada || "Haijatajwa"}: {r.count}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button onClick={() => window.print()}>Print / PDF</button>
          <button onClick={() => setActiveTab && setActiveTab("home")} className={styles.backBtn}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
