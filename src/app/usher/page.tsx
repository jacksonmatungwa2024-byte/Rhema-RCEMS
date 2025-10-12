"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [usajiliSub, setUsajiliSub] = useState<
    "muumini" | "mahadhurio" | "wokovu" | "ushuhuda"
  >("muumini");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData?.session?.user?.email;

      // Admin bypass: no redirect
      const isAdmin = email && user?.role === "admin";

      if (!email && !isAdmin) {
        window.location.href = "/login";
        return;
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !userData || !["admin", "usher"].includes(userData.role)) {
        if (!isAdmin) window.location.href = "/login";
        return;
      }

      setUser(userData);
    };

    loadUser();
  }, []);

  if (!user) return null;

  const { role, full_name, branch } = user;
  const allowedTabs: Record<string, TabType[]> = {
    admin: ["home", "usajili", "mafunzo", "reports", "messages", "profile", "picha"],
    usher: ["home", "usajili", "reports", "profile", "picha"],
  };
  const visibleTabs = allowedTabs[role] || [];

  const handleLogout = async () => {
    if (role !== "admin") {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        {visibleTabs.includes("home") && (
          <button
            className={`${styles.tabBtn} ${
              activeTab === "home" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("home")}
          >
            🏠 Home
          </button>
        )}

        {visibleTabs.includes("usajili") && (
          <button
            className={`${styles.tabBtn} ${
              activeTab === "usajili" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("usajili")}
          >
            🗂️ Usajili
          </button>
        )}

        {visibleTabs.includes("mafunzo") && (
          <button
            className={`${styles.tabBtn} ${
              activeTab === "mafunzo" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("mafunzo")}
          >
            📚 Mafunzo
          </button>
        )}

        {visibleTabs.includes("reports") && (
          <button
            className={`${styles.tabBtn} ${
              activeTab === "reports" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("reports")}
          >
            📊 Reports
          </button>
        )}

        {visibleTabs.includes("picha") && (
          <button
            className={`${styles.tabBtn} ${
              activeTab === "picha" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("picha")}
          >
            🖼️ Picha
          </button>
        )}

        {visibleTabs.includes("profile") && (
          <button
            className={`${styles.tabBtn} ${
              activeTab === "profile" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile
          </button>
        )}

        {/* Only show logout for non-admin */}
        {role !== "admin" && (
          <button onClick={handleLogout} className={styles.logoutBtn}>
            🚪 Toka / Logout
          </button>
        )}
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {activeTab === "home" && (
          <div>
            <h2 className={styles.homeTitle}>
              Karibu {role === "admin" ? "Admin" : "Mhudumu"} {full_name}
            </h2>
            <p className={styles.subText}>Tawi: {branch || "—"}</p>
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
                className={`${styles.subBtn} ${
                  usajiliSub === "muumini" ? styles.subActive : ""
                }`}
                onClick={() => setUsajiliSub("muumini")}
              >
                📝 Muumini
              </button>
              <button
                className={`${styles.subBtn} ${
                  usajiliSub === "mahadhurio" ? styles.subActive : ""
                }`}
                onClick={() => setUsajiliSub("mahadhurio")}
              >
                📋 Mahadhurio
              </button>
              <button
                className={`${styles.subBtn} ${
                  usajiliSub === "wokovu" ? styles.subActive : ""
                }`}
                onClick={() => setUsajiliSub("wokovu")}
              >
                🙏 Wokovu
              </button>
              <button
                className={`${styles.subBtn} ${
                  usajiliSub === "ushuhuda" ? styles.subActive : ""
                }`}
                onClick={() => setUsajiliSub("ushuhuda")}
              >
                🗣️ Ushuhuda
              </button>
            </div>

            <div className={styles.sectionContent}>
              {usajiliSub === "muumini" && <SajiliMuumini />}
              {usajiliSub === "mahadhurio" && (
                <SajiliMahadhurio setActiveTab={setActiveTab} />
              )}
              {usajiliSub === "wokovu" && (
                <SajiliAliyeokoka setActiveTab={setActiveTab} />
              )}
              {usajiliSub === "ushuhuda" && (
                <SajiliUshuhuda setActiveTab={setActiveTab} />
              )}
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
