"use client";

import { useEffect, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SajiliMuumini from "../components/SajiliMuumini";
import SajiliMahadhurio from "../components/SajiliMahadhurio";
import SajiliAliyeokoka from "../components/SajiliAliyeokoka";
import MafunzoMuumini from "../components/MafunzoMuumini";
import SajiliUshuhuda from "../components/SajiliUshuhuda";
import ReportsDashboard from "../components/ReportsDashboard";
import UsherProfile from "../components/UsherProfile";
import UsherGallery from "../components/UsherGallery";

import styles from "./Home.module.css";

export type TabType =
  | "home"
  | "usajili"
  | "mafunzo"
  | "reports"
  | "messages"
  | "profile"
  | "picha";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [usajiliSub, setUsajiliSub] = useState<
    "muumini" | "mahadhurio" | "wokovu" | "ushuhuda"
  >("muumini");
  const [user, setUser] = useState<any>(null);
  const [allowedTabs, setAllowedTabs] = useState<TabType[]>([]);

  // Load user from JWT + /api/me
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("session_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.error) {
        localStorage.removeItem("session_token");
        window.location.href = "/login";
        return;
      }

      setUser(data);
      setAllowedTabs(data.allowedTabs || []);

      // Restore last active tab/subtab for non-admin
      if (data.role !== "admin") {
        const lastTab = localStorage.getItem("home_active_tab") as TabType;
        const lastSub = localStorage.getItem("home_usajili_sub") as
          | "muumini"
          | "mahadhurio"
          | "wokovu"
          | "ushuhuda";

        if (lastTab && (data.allowedTabs || []).includes(lastTab)) {
          setActiveTab(lastTab);
        }
        if (lastSub && ["muumini","mahadhurio","wokovu","ushuhuda"].includes(lastSub)) {
          setUsajiliSub(lastSub);
        }
      }

      // 🔹 Auto logout after 30 mins inactivity
      const timeout = setTimeout(() => {
        alert("Umeachwa bila shughuli. Tafadhali ingia tena.");
        localStorage.removeItem("session_token");
        window.location.href = "/login";
      }, 30 * 60 * 1000);

      return () => clearTimeout(timeout);
    };

    loadUser();
  }, []);

  // Save active tab/subtab for non-admin
  useEffect(() => {
    if (user?.role !== "admin") {
      localStorage.setItem("home_active_tab", activeTab);
      localStorage.setItem("home_usajili_sub", usajiliSub);
    }
  }, [activeTab, usajiliSub, user]);

  const { role, full_name, branch } = user || {};

  const handleLogout = () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("home_active_tab");
    localStorage.removeItem("home_usajili_sub");
    window.location.href = "/login";
  };

  if (!user) return null;

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        {allowedTabs.includes("home") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "home" ? styles.active : ""}`}
            onClick={() => setActiveTab("home")}
          >
            🏠 Home
          </button>
        )}

        {allowedTabs.includes("usajili") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "usajili" ? styles.active : ""}`}
            onClick={() => setActiveTab("usajili")}
          >
            🗂️ Usajili
          </button>
        )}

        {allowedTabs.includes("mafunzo") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "mafunzo" ? styles.active : ""}`}
            onClick={() => setActiveTab("mafunzo")}
          >
            📚 Mafunzo
          </button>
        )}

        {allowedTabs.includes("reports") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "reports" ? styles.active : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            📊 Reports
          </button>
        )}

        {allowedTabs.includes("picha") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "picha" ? styles.active : ""}`}
            onClick={() => setActiveTab("picha")}
          >
            🖼️ Picha
          </button>
        )}

        {allowedTabs.includes("profile") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "profile" ? styles.active : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile
          </button>
        )}

        <button onClick={handleLogout} className={styles.logoutBtn}>
          🚪 Toka / Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {activeTab === "home" && (
          <div>
            <h2 className={styles.homeTitle}>
              Karibu {role === "admin" ? "Admin" : "Mhudumu"} {full_name}
            </h2>
            <p className={styles.subText}>📍 Tawi: {branch || "—"}</p>
            <p className={styles.subText}>
              Chagua kipengele upande wa kushoto ili kuendelea.
            </p>
          </div>
        )}

        {activeTab === "usajili" && (
          <div>
            <h3 className={styles.sectionTitle}>Usajili</h3>
            <p className={styles.sectionText}>Chagua aina ya usajili:</p>

            <div className={styles.subTabs}>
              <button
                className={`${styles.subBtn} ${usajiliSub === "muumini" ? styles.subActive : ""}`}
                onClick={() => setUsajiliSub("muumini")}
              >
                📝 Muumini
              </button>
              <button
                className={`${styles.subBtn} ${usajiliSub === "mahadhurio" ? styles.subActive : ""}`}
                onClick={() => setUsajiliSub("mahadhurio")}
              >
                📋 Mahadhurio
              </button>
              <button
                className={`${styles.subBtn} ${usajiliSub === "wokovu" ? styles.subActive : ""}`}
                onClick={() => setUsajiliSub("wokovu")}
              >
                🙏 Wokovu
              </button>
              <button
                className={`${styles.subBtn} ${usajiliSub === "ushuhuda" ? styles.subActive : ""}`}
                onClick={() => setUsajiliSub("ushuhuda")}
              >
                🗣️ Ushuhuda
              </button>
            </div>

            <div className={styles.sectionContent}>
              {usajiliSub === "muumini" && <SajiliMuumini />}
              {usajiliSub === "mahadhurio" && <SajiliMahadhurio setActiveTab={setActiveTab} />}
              {usajiliSub === "wokovu" && <SajiliAliyeokoka setActiveTab={setActiveTab} />}
              {usajiliSub === "ushuhuda" && <SajiliUshuhuda setActiveTab={setActiveTab} />}
            </div>
          </div>
        )}

        {activeTab === "mafunzo" && <MafunzoMuumini setActiveTab={setActiveTab} />}
        {activeTab === "reports" && <ReportsDashboard setActiveTab={setActiveTab} />}
        {activeTab === "picha" && <UsherGallery />}
        {activeTab === "profile" && <UsherProfile onClose={() => setActiveTab("home")} />}
      </main>

      <SpeedInsights />
    </div>
  );
            }
