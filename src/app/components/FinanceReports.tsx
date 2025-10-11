"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
  import "./FinanceReports.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FinanceReports() {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [finishedList, setFinishedList] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "pending") fetchPending();
    if (activeTab === "finished") fetchFinished();
    if (activeTab === "summary") fetchSummary();
  }, [activeTab]);

  // ✅ Fetch pending michango
  async function fetchPending() {
    const { data, error } = await supabase
      .from("pending_michango")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("❌ Error fetching pending:", error);
    setPendingList(data ?? []);
  }

  // ✅ Fetch finished michango
  async function fetchFinished() {
    const { data, error } = await supabase
      .from("finished_michango")
      .select("*")
      .order("completed_at", { ascending: false });
    if (error) console.error("❌ Error fetching finished:", error);
    setFinishedList(data ?? []);
  }

  // ✅ Fetch summary totals (money-based)
  async function fetchSummary() {
    const { data: pending } = await supabase
      .from("pending_michango")
      .select("kiasi_bado");

    const { data: finished } = await supabase
      .from("finished_michango")
      .select("kiasi_lipwa");

    const totalPending = pending?.reduce(
      (sum, row) => sum + Number(row.kiasi_bado || 0),
      0
    );
    const totalFinished = finished?.reduce(
      (sum, row) => sum + Number(row.kiasi_lipwa || 0),
      0
    );

    setSummary([
      { name: "Pending (Bado)", value: totalPending },
      { name: "Completed (Lipwa)", value: totalFinished }
    ]);
  }

  // Colors for pie chart
  const COLORS = ["#f57c00", "#2e7d32"];

 return (
  <div className="container">
    <h2 className="heading">📊 Ripoti za Michango</h2>

    <div className="tabBar">
      <button
        onClick={() => setActiveTab("pending")}
        className={activeTab === "pending" ? "active" : "tab"}
      >
        ⏳ Pending
      </button>
      <button
        onClick={() => setActiveTab("finished")}
        className={activeTab === "finished" ? "active" : "tab"}
      >
        ✅ Completed
      </button>
      <button
        onClick={() => setActiveTab("summary")}
        className={activeTab === "summary" ? "active" : "tab"}
      >
        💰 Money Summary
      </button>
    </div>

    <div className="panel">
      {/* Pending List */}
      {activeTab === "pending" && (
        <div className="list">
          {pendingList.length === 0 ? (
            <p>Hakuna michango inayosubiri</p>
          ) : (
            pendingList.map((m) => (
              <div key={m.id} className="card pending">
                <h4>{m.majina}</h4>
                <p><strong>Aina:</strong> {m.mchango_type}</p>
                <p><strong>Kiasi Bado:</strong> {m.kiasi_bado?.toLocaleString()} TZS</p>
                <p><strong>Tarehe:</strong> {m.created_at?.split("T")[0]}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Completed List */}
      {activeTab === "finished" && (
        <div className="list">
          {finishedList.length === 0 ? (
            <p>Hakuna michango iliyokamilika</p>
          ) : (
            finishedList.map((m) => (
              <div key={m.id} className="card finished">
                <h4>{m.majina}</h4>
                <p><strong>Aina:</strong> {m.mchango_type}</p>
                <p><strong>Kiasi Lipwa:</strong> {m.kiasi_lipwa?.toLocaleString()} TZS</p>
                <p><strong>Tarehe:</strong> {m.completed_at?.split("T")[0]}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary Pie Chart */}
      {activeTab === "summary" && (
        <>
          <h3>💰 Jumla ya Michango (Fedha)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
  data={summary}
  cx="50%"
  cy="50%"
  outerRadius={120}
  dataKey="value"
  label={({ name, value }) =>
    `${name}: ${(value as number).toLocaleString()} TZS`
  }
>
  {summary.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
  ))}
</Pie>

              <Tooltip
  formatter={(value) =>
    `${(value as number).toLocaleString()} TZS`
  }
/>

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  </div>
);
}