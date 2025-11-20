"use client";

import React, { useEffect, useState, useRef } from "react";
import "./Dashboard.css";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  usher: "Mhudumu",
  pastor: "Mchungaji",
  media: "Media",
  finance: "Fedha",
};

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [branch, setBranch] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [lastLogin, setLastLogin] = useState("");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [statusLight, setStatusLight] = useState<"green" | "red" | "grey">("grey");
  const [statusText, setStatusText] = useState("⏳ Tafadhali chagua paneli.");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 🔒 Session check using JWT
  useEffect(() => {
    const checkSession = async () => {
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

      setRole(data.role);
      setFullName(data.full_name || "");
      setBranch(data.branch || "");
      setProfileUrl(data.profile_url || "");
      setLastLogin(data.last_login ? new Date(data.last_login).toLocaleString() : "");
      setAllowedTabs(data.allowedTabs || []);

      // 🔹 Auto logout after 30 mins inactivity
      const timeout = setTimeout(() => {
        alert("Umeachwa bila shughuli. Tafadhali ingia tena.");
        localStorage.removeItem("session_token");
        window.location.href = "/login";
      }, 30 * 60 * 1000);

      return () => clearTimeout(timeout);
    };

    checkSession();
  }, []);

  const handleClick = (tabId: string, page: string) => {
    if (!allowedTabs.includes(tabId)) {
      setStatusLight("red");
      setStatusText("🚫 Huna ruhusa ya kuingia sehemu hii.");
      return;
    }
    setStatusLight("green");
    setStatusText(`✅ Unaelekezwa kwenye ${tabId}...`);
    window.location.href = page;
  };

  const handleAudioPlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setAudioPlaying(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("session_token");
    window.location.href = "/logout";
  };

  return (
    <div className="dashboard-container">
      <div className="theme-verse">“Nuru yako itangaze gizani.” — Isaya 60:1</div>
      <h2>Karibu {roleLabels[role] || ""} {fullName}</h2>
      {branch && <div className="info-block">📍 Tawi: {branch}</div>}
      {lastLogin && <div className="info-block">🕒 Ilipoingia mwisho: {lastLogin}</div>}
      {profileUrl && <img src={profileUrl} alt="Profile" className="profile-img" />}

      {/* 🔊 Audio Theme */}
      <button onClick={handleAudioPlay}>
        🔊 {audioPlaying ? "Inapigwa..." : "Play Theme"}
      </button>
      <audio ref={audioRef} loop>
        <source src="/ana.mp3" type="audio/mp3" />
      </audio>

      {/* 🟢 Status Indicator */}
      <div className={`status-indicator ${statusLight}`}>
        {statusText}
      </div>

      {/* 🧭 Panel Links */}
      <div className="panel-links">
        {allowedTabs.includes("admin") && (
          <div onClick={() => handleClick("admin", "/admin")}>Admin Panel</div>
        )}
        {allowedTabs.includes("usher") && (
          <div onClick={() => handleClick("usher", "/usher")}>Usher Panel</div>
        )}
        {allowedTabs.includes("pastor") && (
          <div onClick={() => handleClick("pastor", "/pastor")}>Pastor Panel</div>
        )}
        {allowedTabs.includes("media") && (
          <div onClick={() => handleClick("media", "/media")}>Media Team</div>
        )}
        {allowedTabs.includes("finance") && (
          <div onClick={() => handleClick("finance", "/finance")}>Finance</div>
        )}
      </div>

      {/* 🚪 Logout */}
      <button onClick={handleLogout} className="logout-btn">
        🚪 Logout
      </button>
    </div>
  );
        }
