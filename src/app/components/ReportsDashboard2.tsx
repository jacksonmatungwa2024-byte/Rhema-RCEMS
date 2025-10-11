"use client"
import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import "./ReportsDashboard2.css"
import type { ChartOptions } from "chart.js"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ReportsDashboard2() {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [watu, setWatu] = useState<any[]>([])
  const [mahadhurio, setMahadhurio] = useState<any[]>([])
  const [wokovu, setWokovu] = useState<any[]>([])

  useEffect(() => {
    fetchAll()
  }, [startDate, endDate])

 async function fetchAll() {
  setLoading(true);
  setError(null);

  try {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    const [watuRes, mhRes, wokovuRes] = await Promise.all([
      supabase.from("watu").select("*"),
      supabase.from("mahadhurio").select("*"),
      supabase.from("wokovu").select("*"),
    ]);

    if (watuRes.error || mhRes.error || wokovuRes.error) {
      throw watuRes.error || mhRes.error || wokovuRes.error;
    }

    // ✅ Convert timestamp safely & compare with UTC consistency
    const filteredWatu = (watuRes.data ?? []).filter((r) => {
      const rawTime = r.created_at ?? r.created_at_timestamp;
      if (!rawTime) return false;
      const recordDate = new Date(rawTime);
      return recordDate >= start && recordDate <= end;
    });

    const filteredMahadhurio = (mhRes.data ?? []).filter((r) => {
      const rawTime = r.created_at ?? r.tarehe;
      if (!rawTime) return false;
      const recordDate = new Date(rawTime);
      return recordDate >= start && recordDate <= end;
    });

    const filteredWokovu = (wokovuRes.data ?? []).filter((r) => {
      const rawTime = r.created_at ?? r.tarehe;
      if (!rawTime) return false;
      const recordDate = new Date(rawTime);
      return recordDate >= start && recordDate <= end;
    });

    setWatu(filteredWatu);
    setMahadhurio(filteredMahadhurio);
    setWokovu(filteredWokovu);
  } catch (err: any) {
    setError(String(err?.message ?? err));
  } finally {
    setLoading(false);
  }
}


  const chartData = {
    labels: ["Waliosajiliwa", "Mahadhurio", "Waliokoka"],
    datasets: [
      {
        label: `Records (${startDate} to ${endDate})`,
        data: [watu.length, mahadhurio.length, wokovu.length],
        backgroundColor: ["#6a1b9a", "#ff4081", "#00acc1"],
        borderColor: ["#4a148c", "#c2185b", "#00796b"],
        borderWidth: 1,
        borderRadius: 6,
      }
    ]
  }

 const chartOptions: ChartOptions<"bar"> = {
  responsive: true,
  plugins: {
    legend: {
      position: "top", // ✅ no need to cast as const
      labels: {
        color: "#ffffff",
        font: { weight: "bold" }
      }
    },
    title: {
      display: true,
      text: "Live Ministry Data",
      color: "#ffffff",
      font: { size: 18, weight: "bold" }
    },
    tooltip: {
      backgroundColor: "#4a148c",
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      borderColor: "#ffffff",
      borderWidth: 1
    }
  },
  scales: {
    x: {
      ticks: { color: "#ffffff", font: { weight: "bold" } },
      grid: { color: "rgba(255,255,255,0.2)" }
    },
    y: {
      beginAtZero: true,
      ticks: { color: "#ffffff", font: { weight: "bold" } },
      grid: { color: "rgba(255,255,255,0.2)" }
    }
  }
}


  return (
    <div className="reports-dashboard-container">
      <header>
        <h2>📊 Reports Dashboard</h2>
        <div>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button onClick={fetchAll}>Refresh</button>
        </div>
      </header>

      {error && <div>Error: {error}</div>}

      <section>
        <Bar data={chartData} options={chartOptions} />
      </section>

      <section>
        <div>
          <h3>Waliosajiliwa</h3>
          <p className="summary">{watu.length} records</p>
        </div>
        <div>
          <h3>Mahadhurio</h3>
          <p className="summary">{mahadhurio.length} records</p>
        </div>
        <div>
          <h3>Waliokoka</h3>
          <p className="summary">{wokovu.length} records</p>
        </div>
      </section>

      <section>
        <div>
          <h4>Waliosajiliwa</h4>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Majina</th><th>Simu</th><th>Jinsi</th><th>Bahasha</th><th>Created</th>
              </tr>
            </thead>
            <tbody>
              {watu.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.majina}</td>
                  <td>{r.simu ?? "—"}</td>
                  <td>{r.jinsi}</td>
                  <td>{r.bahasha ?? "—"}</td>
                  <td>{(r.created_at ?? r.created_at_timestamp)?.split("T")[0] ?? "—"}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h4>Mahadhurio</h4>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Majina</th><th>Aina</th><th>Ibada</th><th>Tarehe</th>
              </tr>
            </thead>
            <tbody>
              {mahadhurio.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.majina ?? "—"}</td>
                  <td>{r.aina ?? "—"}</td>
                  <td>{r.ibada ?? "—"}</td>
                  <td>{r.tarehe ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h4>Waliokoka</h4>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Majina</th><th>Tarehe</th><th>Ushuhuda</th>
              </tr>
            </thead>
            <tbody>
              {wokovu.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.majina ?? "—"}</td>
                  <td>{r.tarehe ?? "—"}</td>
                  <td>{r.ushuhuda ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
