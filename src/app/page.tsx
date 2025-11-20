"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./welcome.module.css";

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installVisible, setInstallVisible] = useState(false);

  const introRef = useRef<HTMLAudioElement>(null);

  // 🎵 Preloader sound + timer
  useEffect(() => {
    if (introRef.current) {
      introRef.current.volume = 0.7; // adjust volume
      introRef.current.play().catch(() => {});
    }
    const loadTimer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(loadTimer);
  }, []);

  // 🎛️ Show buttons after animation
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowOptions(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // 🔌 Register Service Worker (PWA)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker Registered"))
        .catch((err) => console.log("SW registration failed:", err));
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // 📲 Handle App Install
  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
      setInstallVisible(false);
    }
  };

  // 🍪 Set cookie visitedHome (expiry 30 min)
  useEffect(() => {
    document.cookie = `visitedHome=true; max-age=${60 * 30}; path=/; secure; samesite=strict`;
  }, []);

  // 🔄 Loader Phase
  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.lightRays}></div>
        <div className={styles.glowCross}></div>
        <p className={styles.loaderText}>Lumina Church Management System</p>
        {/* 🔊 Intro looping sound */}
        <audio ref={introRef} loop autoPlay>
          <source src="/intro-tone.mp3" type="audio/mp3" />
        </audio>
      </div>
    );
  }

  // 🌟 Main Welcome Screen
  return (
    <div className={styles.container}>
      <h1 className={`${styles.glowText} ${styles.fadeIn}`}>
        🕊️ Karibu <span className={styles.brand}>Lumina Outreach System</span>
      </h1>

      <p className={`${styles.subText} ${styles.fadeInDelay}`}>
        “Karibu mahali pa mwanga na uratibu.”
      </p>

      {showOptions && (
        <div className={styles.buttonGroup}>
          <button
            className={styles.glowButton}
            onClick={() => router.push("/login")}
          >
            🔑 Nenda Login
          </button>
          {installVisible && (
            <button className={styles.glowButton} onClick={handleInstall}>
              📲 Install App
            </button>
          )}
        </div>
      )}

      <footer className={`${styles.footer} ${styles.fadeInDelay5}`}>
        🙌 Mfumo huu umetengenezwa na <b>Abel Memorial Programmers</b>
        <br />
        kwa ushirikiano na
        <br />
        <b>Kitengo cha Usimamizi wa Rasilimali na Utawala – Tanga Quarters</b>
        <br />
        <span className={styles.legacy}>© Lumina Legacy</span>
      </footer>
    </div>
  );
}
