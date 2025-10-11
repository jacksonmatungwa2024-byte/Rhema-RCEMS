"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./FinancePanel.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FormState = {
  title: string;
  description: string;
  amount: string;
  currency: string;
  requested_by: string;
  requested_by_id: number;
  department: string;
  note: string;
};

export default function FinancePanel() {
  const [activeTab, setActiveTab] = useState("create");
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    amount: "",
    currency: "TZS",
    requested_by: "Finance Officer",
    requested_by_id: 1,
    department: "",
    note: "",
  });

  const [approvedBudgets, setApprovedBudgets] = useState<any[]>([]);
  const [declinedBudgets, setDeclinedBudgets] = useState<any[]>([]);
  const [pendingBudgets, setPendingBudgets] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (activeTab === "approved") fetchApproved();
    if (activeTab === "declined") fetchDeclined();
    if (activeTab === "pending") fetchPending();
  }, [activeTab]);

  async function fetchApproved() {
    const { data, error } = await supabase
      .from("approved_budgets")
      .select("*")
      .order("approved_at", { ascending: false });

    if (error) console.error("Approved fetch error:", error);
    else setApprovedBudgets(data ?? []);
  }

  async function fetchDeclined() {
    const { data, error } = await supabase
      .from("declined_budgets")
      .select("*")
      .order("declined_at", { ascending: false });

    if (error) console.error("Declined fetch error:", error);
    else setDeclinedBudgets(data ?? []);
  }

  async function fetchPending() {
    const { data, error } = await supabase
      .from("approval")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) console.error("Pending fetch error:", error);
    else setPendingBudgets(data ?? []);
  }

  async function submitBudget(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      const { data, error } = await supabase.from("approval").insert([
        {
          title: form.title,
          description: form.description,
          amount: parseFloat(form.amount),
          currency: form.currency,
          requested_by: form.requested_by,
          requested_by_id: form.requested_by_id,
          department: form.department,
          note: form.note,
          muumini_id: form.requested_by_id,
          status: "pending",
          tarehe: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Insert error:", error);
        setMessage("⚠️ Hitilafu wakati wa kuwasilisha bajeti. Angalia console.");
        return;
      }

      console.log("✅ Budget submitted:", data);
      setMessage("✅ Bajeti imewasilishwa kwa idhini.");
      setForm({
        title: "",
        description: "",
        amount: "",
        currency: "TZS",
        requested_by: "Finance Officer",
        requested_by_id: 1,
        department: "",
        note: "",
      });
      fetchPending();
      setActiveTab("pending");
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage("⚠️ Tatizo lisilotarajiwa limejitokeza. Tafadhali jaribu tena.");
    }
  }

  return (
    <div className="container">
      <h2 className="heading">💰 Finance Panel</h2>

      <div className="tabBar">
        <button
          onClick={() => setActiveTab("create")}
          className={activeTab === "create" ? "active" : "tab"}
        >
          ➕ Unda Bajeti
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={activeTab === "pending" ? "active" : "tab"}
        >
          ⏳ Zinazosubiri
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={activeTab === "approved" ? "active" : "tab"}
        >
          ✅ Zilizopitishwa
        </button>
        <button
          onClick={() => setActiveTab("declined")}
          className={activeTab === "declined" ? "active" : "tab"}
        >
          ⛔ Zilizokataliwa
        </button>
      </div>

      <div className="panel">
        {activeTab === "create" && (
          <form onSubmit={submitBudget} className="form">
            <input
              placeholder="Kichwa cha Bajeti"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Maelezo"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Kiasi (Tsh)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <input
              placeholder="Idara"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <textarea
              placeholder="Maelezo ya ziada"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
            <button type="submit">📤 Wasilisha Bajeti</button>
            {message && <p className="message">{message}</p>}
          </form>
        )}

        {activeTab === "pending" && (
          <div className="list">
            {pendingBudgets.length === 0 ? (
              <p>📭 Hakuna bajeti zinazosubiri idhini</p>
            ) : (
              pendingBudgets.map((b) => (
                <div key={b.id} className="card">
                  <h4>
                    {b.title ?? "—"} · {b.amount ?? "—"} {b.currency ?? ""}
                  </h4>
                  <p>{b.description ?? "Hakuna maelezo"}</p>
                  <p><strong>Idara:</strong> {b.department ?? "—"}</p>
                  <p><strong>Aliyeomba:</strong> {b.requested_by ?? "—"}</p>
                  <p><strong>Tarehe:</strong> {b.tarehe ?? "—"}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "approved" && (
          <div className="list">
            {approvedBudgets.length === 0 ? (
              <p>📭 Hakuna bajeti zilizopitishwa</p>
            ) : (
              approvedBudgets.map((b) => (
                <div key={b.id} className="card approved">
                  <h4>
                    {b.title} · {b.amount} {b.currency}
                  </h4>
                  <p>{b.description}</p>
                  <p><strong>Imeidhinishwa na:</strong> {b.approved_by}</p>
                  <p><strong>Tarehe:</strong> {b.approved_at?.split("T")[0] ?? "—"}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "declined" && (
          <div className="list">
            {declinedBudgets.length === 0 ? (
              <p>📭 Hakuna bajeti zilizokataliwa</p>
            ) : (
              declinedBudgets.map((b) => (
                <div key={b.id} className="card declined">
                  <h4>
                    {b.title} · {b.amount} {b.currency}
                  </h4>
                  <p>{b.description}</p>
                  <p><strong>Sababu:</strong> {b.declined_reason}</p>
                  <p><strong>Aliyekataa:</strong> {b.declined_by}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
