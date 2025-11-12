"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./welcome.module.css";

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const introRef = useRef<HTMLAudioElement>(null); // 🔊 New intro sound

  // 🎵 Preloader sound + timer
  useEffect(() => {
    if (introRef.current) {
      introRef.current.volume = 0.8;
      introRef.current.play().catch(() => {});
    }

    const loadTimer = setTimeout(() => setLoading(false), 3000); // show loader for 3s
    return () => clearTimeout(loadTimer);
  }, []);

  // 🎛️ Show buttons after animation
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowOptions(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // ▶️ Play video with sound
  const handleVideo = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play();
      setPlaying(true);
      videoRef.current.onended = () => router.push("/login");
    }
  };

  // 🎶 Play Lumina theme
  const handleTheme = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.classList.add(styles.fadeOut);
    }
    if (audioRef.current) {
      audioRef.current.volume = 1;
      audioRef.current.play();
      setPlaying(true);
      setTimeout(() => router.push("/login"), 15000);
    }
  };

  // 🔄 Loader phase
  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.glowCross}></div>
        <p className={styles.loaderText}>Lumina Outreach System</p>

        {/* Intro Sound */}
        <audio ref={introRef}>
          <source src="/intro-tone.mp3" type="audio/mp3" />
        </audio>
      </div>
    );
  }

  // 🌟 Main Welcome Screen
  return (
    <div className={styles.container}>
      <video
        ref={videoRef}
        className={styles.videoBackground}
        autoPlay
        muted
        playsInline
      >
        <source src="/aerial.mp4" type="video/mp4" />
      </video>

      <h1 className={`${styles.glowText} ${styles.fadeIn}`}>
        🕊️ Karibu <span className={styles.brand}>Lumina Outreach System</span>
      </h1>

      <p className={`${styles.subText} ${styles.fadeInDelay}`}>
        “Karibu mahali pa mwanga na uratibu.”
      </p>

      {showOptions && !playing && (
        <div className={styles.buttonGroup}>
          <button className={styles.glowButton} onClick={handleVideo}>
            ▶️ Sikiliza Video
          </button>
          <button className={styles.glowButton} onClick={handleTheme}>
            🔊 Sikiliza Lumina
          </button>
        </div>
      )}

      <audio ref={audioRef}>
        <source src="/theme.mp3" type="audio/mp3" />
      </audio>

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
}
