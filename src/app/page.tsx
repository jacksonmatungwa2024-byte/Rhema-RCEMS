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
    if (videoRef.current) {
      videoRef.current.classList.add(styles.fadeOut);
      setTimeout(() => videoRef.current?.pause(), 800);
    }
    if (audioRef.current) {
      audioRef.current.volume = 1;
      audioRef.current.play();
      setPlayingTheme(true);
    }
    setTimeout(() => router.push("/login"), 15000);
  };

  return (
    <div className={styles.container}>
      <video ref={videoRef} className={styles.videoBackground} autoPlay playsInline>
        <source src="/aerial.mp4" type="video/mp4" />
      </video>

      <h1 className={`${styles.glowText} ${styles.fadeIn}`}>
        🕊️ Karibu <span className={styles.brand}>Lumina Outreach System</span>
      </h1>

      <p className={`${styles.subText} ${styles.fadeInDelay}`}>
        “Karibu mahali pa mwanga na uratibu.”
      </p>

      {showButton && !playingTheme && (
        <button className={styles.glowButton} onClick={handlePlay}>
          🔊 Sikia Muziki
        </button>
      )}

      <audio ref={audioRef}>
        <source src="/theme.mp3" type="audio/mp3" />
      </audio>

      <footer className={`${styles.footer} ${styles.fadeInDelay5}`}>
        © November 2025, Lumina  Legacy
      </footer>
    </div>
  );
}
