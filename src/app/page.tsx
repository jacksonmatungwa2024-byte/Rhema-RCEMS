"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./welcome.module.css";

export default function WelcomePage() {
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);
  const [playingTheme, setPlayingTheme] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handlePlay = () => {
    // Zima video kwa transition
    if (videoRef.current) {
      videoRef.current.classList.add(styles.fadeOut);
      setTimeout(() => videoRef.current?.pause(), 800);
    }

    // Cheza audio
    if (audioRef.current) {
      audioRef.current.volume = 1;
      audioRef.current.play();
      setPlayingTheme(true);
    }

    // Baada ya sekunde 15 nenda login
    setTimeout(() => router.push("/login"), 15000);
  };

  return (
    <div className={styles.container}>
      {/* Background Video */}
      <video
        ref={videoRef}
        className={styles.videoBackground}
        autoPlay
        playsInline
      >
        <source src="/aerial.mp4" type="video/mp4" />
      </video>

      {/* Main Title */}
      <h1 className={`${styles.glowText} ${styles.fadeIn}`}>
        🕊️ Karibu{" "}
        <span className={styles.brand}>Lumina Outreach Management System</span>
      </h1>

      {/* Taglines */}
      <p className={`${styles.subText} ${styles.fadeInDelay}`}>
        “Karibu mahali pa mwanga, huduma, na uratibu wa kiroho.”
      </p>
      <p className={`${styles.subText} ${styles.fadeInDelay2}`}>
        Tunakupongeza kwa kuchagua <b>Lumina</b> – mfumo unaoangaza njia ya
        usimamizi bora.
      </p>
      <p className={`${styles.subText} ${styles.fadeInDelay3}`}>
        Hapa, tunasimamia kwa hekima, tunahudumu kwa upendo, na tunajenga urithi
        wa kudumu.
      </p>

      {/* Verse */}
      <div className={`${styles.verse} ${styles.fadeInDelay4}`}>
        💡 “Kwa hekima hujengwa nyumba, kwa ufahamu huimarishwa,
        na kwa maarifa vyumba hujaa hazina ya thamani.”
        <br />— <i>Methali 24:3–4</i>
      </div>

      {/* Play Button */}
      {showButton && !playingTheme && (
        <button className={styles.glowButton} onClick={handlePlay}>
          🔊 Sikia Muziki wa Lumina
        </button>
      )}

      {/* Audio */}
      <audio ref={audioRef}>
        <source src="/theme.mp3" type="audio/mp3" />
      </audio>

      {/* Footer */}
      <footer className={`${styles.footer} ${styles.fadeInDelay5}`}>
        🙌 Mfumo huu umetengenezwa na <b>Abel Memorial Programmers</b>
        <br />
        kwa ushirikiano na{" "}
        <b>Kitengo cha Usimamizi wa Rasilimali na Utawala – Tanga Quarters</b>
        <br />
        <span className={styles.legacy}>© Lumina RCEMS Legacy</span>
      </footer>
    </div>
  );
}
