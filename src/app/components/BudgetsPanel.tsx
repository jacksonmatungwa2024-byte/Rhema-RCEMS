import React, { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import "./BudgetsPanel.css"
const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type BudgetRow = {
  id: number | string;
  title?: string;
  amount?: number | null;
  requested_by?: string | null;
  created_at?: string | null;
  description?: string | null;
};

type Approver = {
  full_name: string;
};

const fixedApprovers: Approver[] = [
  { full_name: "PASTOR PETER BARNABA" },
  { full_name: "PASTOR JOHANES KASIMBAZI" },
];

export default function BudgetsPanel() {
  const [pending, setPending] = useState<BudgetRow[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<BudgetRow | null>(null);
  const [approver, setApprover] = useState<string>(fixedApprovers[0].full_name);
  const [phone, setPhone] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [maelezo, setMaelezo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  async function fetchBudgets() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("approval")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPending(data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }

  function openEditForm(budget: BudgetRow) {
    setSelectedBudget(budget);
    setMaelezo(budget.description || "");
    setDate(new Date().toISOString().slice(0, 10));
    setApprover(fixedApprovers[0].full_name);
    setPhone("");
    setSignature("");
  }

  async function handleSubmit(approve: boolean) {
    if (!selectedBudget) return;

    if (!approver.trim()) {
      setError("Tafadhali chagua approver.");
      return;
    }
    if (!phone.trim()) {
      setError("Tafadhali ingiza nambari ya simu ya approver.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        ...selectedBudget,
        approved_by: approver,
        approved_phone: phone,
        approved_signature: signature,
        approved_date: date,
        maelezo,
        status: approve ? "approved" : "declined",
        updated_at: new Date().toISOString(),
      };

      if (approve) {
        const { error: err } = await supabase
          .from("approved_budgets")
          .insert([updateData]);
        if (err) throw err;
        await supabase.from("approval").delete().eq("id", selectedBudget.id);
      } else {
        const { error: err } = await supabase
          .from("declined_budgets")
          .insert([updateData]);
        if (err) throw err;
        await supabase.from("approval").delete().eq("id", selectedBudget.id);
      }

      await fetchBudgets();
      generatePDF(updateData, approve);
      setSelectedBudget(null);
    } catch (e: any) {
      setError(e.message || "Error saving budget");
    } finally {
      setLoading(false);
    }
  }

  async function generatePDF(data: any, approved: boolean) {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    if (approved) {
      const logoUrl = "/rhema.jpg";
      const logo = new Image();
      logo.src = logoUrl;
      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve();
        logo.onerror = () => reject();
      });
      const logoWidth = 30;
      const logoHeight = 30;
      const logoX = (pageWidth - logoWidth) / 2;
      pdf.addImage(logo, "PNG", logoX, 10, logoWidth, logoHeight);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(
      "Basi iweni na akili mkeshe katika sala 1PETRO 4:7",
      pageWidth / 2,
      approved ? 50 : 20,
      { align: "center" }
    );

    pdf.setFontSize(10);
    const startY = approved ? 60 : 30;
    pdf.text(`Title: ${data.title || "-"}`, 10, startY);
    pdf.text(`Amount: ${data.amount || "-"}`, 10, startY + 10);
    pdf.text(`Requested By: ${data.requested_by || "-"}`, 10, startY + 20);
    pdf.text(`Approver: ${data.approved_by || "-"}`, 10, startY + 30);
    pdf.text(`Phone: ${data.approved_phone || "-"}`, 10, startY + 40);
    pdf.text(`Signature: ${data.approved_signature || "-"}`, 10, startY + 50);
    pdf.text(`Date: ${data.approved_date || "-"}`, 10, startY + 60);
    pdf.text(`Maelezo: ${data.maelezo || "-"}`, 10, startY + 70);

    if (!approved) {
      pdf.setTextColor(255, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text("DECLINED", pageWidth / 2, startY + 90, { align: "center" });
    }

    pdf.save(
      `${approved ? "approved" : "declined"}_budget_${data.id}_${data.approved_date}.pdf`
    );
  }

  return (
    <div className="budgets-container">
      <h2>Pending Budgets</h2>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      <table className="budget-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Amount</th>
            <th>Requested By</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {pending.length === 0 ? (
            <tr>
              <td colSpan={5} className="no-data">
                Hakuna pending budgets
              </td>
            </tr>
          ) : (
            pending.map((b, i) => (
              <tr
                key={b.id}
                onClick={() => openEditForm(b)}
                className="clickable-row"
              >
                <td>{i + 1}</td>
                <td>{b.title}</td>
                <td>{b.amount}</td>
                <td>{b.requested_by}</td>
                <td>{b.created_at?.split("T")[0]}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedBudget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editing Budget: {selectedBudget.title}</h3>

            <label>Approver:</label>
            <select
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
            >
              {fixedApprovers.map((a) => (
                <option key={a.full_name} value={a.full_name}>
                  {a.full_name}
                </option>
              ))}
            </select>

            <label>Phone Number:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ingiza nambari ya simu"
            />

            <label>Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <label>Signature:</label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Ingiza signature (optional)"
            />

            <label>Maelezo:</label>
            <textarea
              value={maelezo}
              onChange={(e) => setMaelezo(e.target.value)}
              rows={3}
            />

            <div className="modal-buttons">
              <button
                className="approve"
                onClick={() => handleSubmit(true)}
                disabled={loading}
              >
                Kubali
              </button>
              <button
                className="decline"
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                Kataa
              </button>
              <button
                className="cancel"
                onClick={() => setSelectedBudget(null)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>

            {error && <p className="error-text">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
