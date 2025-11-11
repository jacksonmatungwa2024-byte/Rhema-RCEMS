"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./welcome.module.css";

const WelcomePage: React.FC = () => {
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setAudioStarted(true);
      // After 25 seconds redirect to login
      setTimeout(() => router.push("/login"), 25000);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Video */}
      <video className={styles.videoBackground} autoPlay muted loop playsInline>
        <source src="/aerial.mp4" type="video/mp4" />
      </video>

      {/* Main Title */}
      <h1 className={`${styles.glowText} ${styles.fadeIn}`}>
        🕊️ Karibu <span className={styles.brand}>Lumina Outreach Management System</span>
      </h1>

      {/* Tagline */}
      <p className={`${styles.subText} ${styles.fadeInDelay}`}>
        “Karibu mahali pa mwanga, huduma, na uratibu wa kiroho.”  
      </p>
      <p className={`${styles.subText} ${styles.fadeInDelay2}`}>
        Tunakupongeza kwa kuchagua <b>Lumina</b> – mfumo unaoangaza njia ya usimamizi bora wa taasisi, huduma, na jamii.  
      </p>
      <p className={`${styles.subText} ${styles.fadeInDelay3}`}>
        Hapa, tunasimamia kwa hekima, tunahudumu kwa upendo, na tunajenga urithi wa kudumu.
      </p>

      {/* Bible Verse */}
      <div className={`${styles.verse} ${styles.fadeInDelay4}`}>
        💡 “Kwa hekima hujengwa nyumba, kwa ufahamu huimarishwa,  
        na kwa maarifa vyumba hujaa hazina ya thamani na uzuri.”  
        <br />— <i>Methali 24:3–4</i>
      </div>

      {/* Play Button */}
      {showButton && !audioStarted && (
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
        kwa ushirikiano na  
        <br />
        <b>Kitengo cha Usimamizi wa Rasilimali na Utawala – Tanga Quarters</b>
        <br />
        <span className={styles.legacy}>© Lumina RCEMS Legacy</span>
      </footer>
    </div>
  );
};

export default WelcomePage;
  
