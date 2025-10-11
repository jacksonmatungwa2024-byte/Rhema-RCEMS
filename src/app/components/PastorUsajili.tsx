"use client"

import React, { useEffect, useState } from "react"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import './PastorUsajili.css'
import html2pdf from "html2pdf.js"

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

type WatuRow = { id: number; majina: string; simu?: string | null; jinsi: string; umbo: string; bahasha?: string | null; muumini_namba?: string | null; created_at?: string | null; [key: string]: any }
type MahadhurioRow = { id: number; muumini_id?: number | null; muumini_namba?: string | null; majina?: string | null; aina?: string | null; ibada?: string | null; tarehe?: string | null; created_at?: string | null; [key: string]: any }
type ApprovalRow = { id: number; muumini_id: string; status?: string; tarehe: string; created_at?: string; updated_at?: string; [key: string]: any }
type WokovuRow = { id: string; muumini_id?: number | null; muumini_namba?: string | null; majina?: string | null; tarehe?: string | null; ushuhuda?: string | null; sajili_na?: string | null; created_at?: string | null; [key: string]: any }

export default function PastorUsajili() {
  const [active, setActive] = useState<"waliosajiliwa" | "mahadhurio" | "wachanga">("waliosajiliwa")
  const [wachangaSub, setWachangaSub] = useState<"approval" | "waliokoka">("approval")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const REFRESH_MS = 2 * 60 * 1000

  const [watu, setWatu] = useState<WatuRow[]>([])
  const [watuQuery, setWatuQuery] = useState("")
  const [watuPage, setWatuPage] = useState(1)
  const WATU_PAGE_SIZE = 50

  const [mahadhurio, setMahadhurio] = useState<MahadhurioRow[]>([])
  const [mhFilterRange, setMhFilterRange] = useState<"siku" | "wiki" | "mwezi">("siku")
  const [mhDate, setMhDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [mhPage, setMhPage] = useState(1)
  const MH_PAGE_SIZE = 50

  const [approvals, setApprovals] = useState<ApprovalRow[]>([])
  const [approvalsPage, setApprovalsPage] = useState(1)
  const APPROVALS_PAGE_SIZE = 50

  const [wokovu, setWokovu] = useState<WokovuRow[]>([])
  const [wokovuPage, setWokovuPage] = useState(1)
  const WOKOVU_PAGE_SIZE = 50

  useEffect(() => { fetchWatu() }, [watuPage, watuQuery])
  useEffect(() => { fetchMahadhurio() }, [mhFilterRange, mhDate, mhPage])
  useEffect(() => { fetchApprovals(); fetchWokovu() }, [approvalsPage, wokovuPage, wachangaSub])

  useEffect(() => {
    let mounted = true
    if (!autoRefresh) return
    const t = window.setInterval(() => {
      if (!mounted) return
      if (active === "waliosajiliwa") fetchWatu()
      if (active === "mahadhurio") fetchMahadhurio()
      if (active === "wachanga") { fetchApprovals(); fetchWokovu() }
    }, REFRESH_MS)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [autoRefresh, active, mhFilterRange, mhDate, watuPage, mhPage, approvalsPage, wokovuPage])

  async function fetchWatu() {
    setLoading(true)
    setError(null)
    try {
      const offset = (watuPage - 1) * WATU_PAGE_SIZE
      let q = supabase.from("watu").select("*").order("created_at", { ascending: false }).range(offset, offset + WATU_PAGE_SIZE - 1)
      if (watuQuery && watuQuery.trim()) {
        const like = `%${watuQuery.trim()}%`
        q = supabase.from("watu").select("*").or(`majina.ilike.${like},muumini_namba.ilike.${like},simu.ilike.${like},bahasha.ilike.${like}`).order("created_at", { ascending: false }).range(offset, offset + WATU_PAGE_SIZE - 1)
      }
      const { data, error } = await q
      if (error) throw error
      setWatu((data as WatuRow[]) ?? [])
    } catch (err: any) {
      setError(String(err?.message ?? err))
      setWatu([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchMahadhurio() {
    setLoading(true)
    setError(null)
    try {
      const offset = (mhPage - 1) * MH_PAGE_SIZE
      const baseDate = new Date(mhDate)
      let start = new Date(baseDate)
      let end = new Date(baseDate)
      if (mhFilterRange === "siku") {
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
      } else if (mhFilterRange === "wiki") {
        const day = baseDate.getDay()
        const diffToMonday = (day + 6) % 7
        start = new Date(baseDate)
        start.setDate(baseDate.getDate() - diffToMonday)
        start.setHours(0, 0, 0, 0)
        end = new Date(start)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
      } else {
        start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
        end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
      }
      const startISO = start.toISOString().split("T")[0]
      const endISO = end.toISOString().split("T")[0]
      const { data, error } = await supabase.from("mahadhurio").select("*").gte("tarehe", startISO).lte("tarehe", endISO).order("tarehe", { ascending: false }).range(offset, offset + MH_PAGE_SIZE - 1)
      if (error) throw error
      setMahadhurio((data as MahadhurioRow[]) ?? [])
    } catch (err: any) {
      setError(String(err?.message ?? err))
      setMahadhurio([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchApprovals() {
    setLoading(true)
    setError(null)
    try {
      const offset = (approvalsPage - 1) * APPROVALS_PAGE_SIZE
      const { data, error } = await supabase.from("mafunzo").select("*").eq("status", "pending").order("created_at", { ascending: false }).range(offset, offset + APPROVALS_PAGE_SIZE - 1)
      if (error) throw error
      setApprovals((data as ApprovalRow[]) ?? [])
    } catch (err: any) {
      setError(String(err?.message ?? err))
      setApprovals([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchWokovu() {
    setLoading(true)
    setError(null)
    try {
      const offset = (wokovuPage - 1) * WOKOVU_PAGE_SIZE
      const { data, error } = await supabase.from("wokovu").select("*").order("created_at", { ascending: false }).range(offset, offset + WOKOVU_PAGE_SIZE - 1)
      if (error) throw error
      setWokovu((data as WokovuRow[]) ?? [])
    } catch (err: any) {
      setError(String(err?.message ?? err))
      setWokovu([])
    } finally {
      setLoading(false)
    }
  }

  function downloadCSV<T extends Record<string, any>>(rows: T[], filename = "export.csv") {
    if (!rows || rows.length === 0) {
      alert("Hakuna data ya kupakua")
      return
    }
    const keys = Array.from(rows.reduce((s, r) => {
      Object.keys(r).forEach(k => s.add(k))
      return s
    }, new Set<string>()))
    const csv = [
      keys.join(","),
      ...rows.map(r => keys.map(k => {
        const v = r[k] ?? ""
        // Escape quotes
        return `"${String(v).replace(/"/g, '""')}"`
      }).join(","))
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


async function printTable(tableId: string) {
  if (typeof window === "undefined") return; // Make sure it only runs on client

  const table = document.getElementById(tableId);
  if (!table) {
    alert("Hakuna jedwali la kuchapisha");
    return;
  }

  // Dynamically import html2pdf only in browser
  const html2pdf = (await import("html2pdf.js")).default;

  // Create a container for printable content
  const container = document.createElement("div");
  container.style.backgroundColor = "#0b1e3a";
  container.style.color = "#e0f2e9";
  container.style.padding = "20px";
  container.style.fontFamily = "Arial, sans-serif";

  const header = document.createElement("div");
  header.style.textAlign = "center";
  header.style.marginBottom = "15px";

  const logo = document.createElement("img");
  logo.src = "/rhema.jpg";
  logo.alt = "Rhema Logo";
  logo.style.width = "90px";
  logo.style.marginBottom = "5px";

  const verse = document.createElement("div");
  verse.textContent = "“Basi weni na akili mkeshe katika sala” — 1 PETRO 4:7";
  verse.style.color = "#00b87a";
  verse.style.fontWeight = "500";
  verse.style.fontSize = "14pt";

  header.appendChild(logo);
  header.appendChild(verse);

  const tableClone = table.cloneNode(true) as HTMLElement;
  tableClone.style.width = "100%";
  tableClone.style.borderCollapse = "collapse";
  tableClone.style.backgroundColor = "#11294a";
  tableClone.style.color = "#e0f2e9";

  const ths = tableClone.querySelectorAll("th");
  ths.forEach(th => {
    (th as HTMLElement).style.backgroundColor = "#007f5f";
    (th as HTMLElement).style.color = "white";
    (th as HTMLElement).style.textTransform = "uppercase";
    (th as HTMLElement).style.border = "1px solid #00b87a";
    (th as HTMLElement).style.padding = "8px";
  });

  const tds = tableClone.querySelectorAll("td");
  tds.forEach(td => {
    (td as HTMLElement).style.border = "1px solid #00b87a";
    (td as HTMLElement).style.padding = "8px";
  });

  const trs = tableClone.querySelectorAll("tbody tr");
  trs.forEach((tr, i) => {
    (tr as HTMLElement).style.backgroundColor = i % 2 === 0 ? "#0e2240" : "#11294a";
  });

  container.appendChild(header);
  container.appendChild(tableClone);

  const options = {
    margin: 10,
    filename: `${tableId}.pdf`,
    image: { type: "jpeg" as "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: "#0b1e3a" },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as "portrait" },
  };

  html2pdf().set(options).from(container).save();
}


 return (
  <>
    <div className="navbar">
      <button onClick={() => setActive("waliosajiliwa")}>Waliosajiliwa</button>
      <button onClick={() => setActive("mahadhurio")}>Mahadhurio</button>
      <button onClick={() => setActive("wachanga")}>Wachanga</button>
    </div>

    

      {error && <div>{error}</div>}
      {loading && <div>Loading...</div>}

      {active === "waliosajiliwa" && (
        <>
          <input
            placeholder="Tafuta..."
            value={watuQuery}
            onChange={e => setWatuQuery(e.target.value)}
          />
          <table id="table-waliosajiliwa">
            <thead>
              <tr>
                <th>Majina</th>
                <th>Simu</th>
                <th>Jinsi</th>
                <th>Umbo</th>
                <th>Bahasha</th>
                <th>Muumini Namba</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {watu.map(w => (
                <tr key={w.id}>
                  <td>{w.majina}</td>
                  <td>{w.simu ?? "-"}</td>
                  <td>{w.jinsi}</td>
                  <td>{w.umbo}</td>
                  <td>{w.bahasha ?? "-"}</td>
                  <td>{w.muumini_namba ?? "-"}</td>
                  <td>{w.created_at ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => printTable("table-waliosajiliwa")}>Print PDF</button>
          <button onClick={() => downloadCSV(watu, "waliosajiliwa.csv")}>Download CSV</button>
        </>
      )}

      {active === "mahadhurio" && (
        <>
          <div>
            <select value={mhFilterRange} onChange={e => setMhFilterRange(e.target.value as any)}>
              <option value="siku">Siku</option>
              <option value="wiki">Wiki</option>
              <option value="mwezi">Mwezi</option>
            </select>
            <input
              type="date"
              value={mhDate}
              onChange={e => setMhDate(e.target.value)}
            />
          </div>
          <table id="table-mahadhurio">
            <thead>
              <tr>
                <th>Tarehe</th>
                <th>Majina</th>
                <th>Aina</th>
                <th>Ibada</th>
              </tr>
            </thead>
            <tbody>
              {mahadhurio.map(mh => (
                <tr key={mh.id}>
                  <td>{mh.tarehe ?? "-"}</td>
                  <td>{mh.majina ?? "-"}</td>
                  <td>{mh.aina ?? "-"}</td>
                  <td>{mh.ibada ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => printTable("table-mahadhurio")}>Print PDF</button>
          <button onClick={() => downloadCSV(mahadhurio, "mahadhurio.csv")}>Download CSV</button>
        </>
      )}

      {active === "wachanga" && (
        <>
          <div>
            <button onClick={() => setWachangaSub("approval")}>Approvals</button>
            <button onClick={() => setWachangaSub("waliokoka")}>Waliokoka</button>
          </div>
          {wachangaSub === "approval" && (
            <>
              <table id="table-approval">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Muumini ID</th>
                    <th>Status</th>
                    <th>Tarehe</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map(a => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.muumini_id}</td>
                      <td>{a.status ?? "-"}</td>
                      <td>{a.tarehe}</td>
                      <td>{a.created_at ?? "-"}</td>
                      <td>{a.updated_at ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => printTable("table-approval")}>Print PDF</button>
              <button onClick={() => downloadCSV(approvals, "approvals.csv")}>Download CSV</button>
            </>
          )}
          {wachangaSub === "waliokoka" && (
            <>
              <table id="table-waliokoka">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Muumini ID</th>
                    <th>Muumini Namba</th>
                    <th>Majina</th>
                    <th>Tarehe</th>
                    <th>Ushuhuda</th>
                    <th>Sajili Na</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {wokovu.map(w => (
                    <tr key={w.id}>
                      <td>{w.id}</td>
                      <td>{w.muumini_id ?? "-"}</td>
                      <td>{w.muumini_namba ?? "-"}</td>
                      <td>{w.majina ?? "-"}</td>
                      <td>{w.tarehe ?? "-"}</td>
                      <td>{w.ushuhuda ?? "-"}</td>
                      <td>{w.sajili_na ?? "-"}</td>
                      <td>{w.created_at ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => printTable("table-waliokoka")}>Print PDF</button>
              <button onClick={() => downloadCSV(wokovu, "waliokoka.csv")}>Download CSV</button>
            </>
          )}
        </>
      )}
    </>
  )
}
