"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./welcome.module.css";

export default function WelcomePage() {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowOptions(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // ======= Option 1: Play video with sound =======
  const handleVideo = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play();
      setPlaying(true);
      // redirect after video ends
      videoRef.current.onended = () => router.push("/login");
    }
  };

  // ======= Option 2: Play Lumina theme =======
  const handleTheme = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.classList.add(styles.fadeOut);
    }
    if (audioRef.current) {
      audioRef.current.volume = 1;
      audioRef.current.play();
      setPlaying(true);
      // redirect after 15 sec
      setTimeout(() => router.push("/login"), 15000);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Video */}
      <video
        ref={videoRef}
        className={styles.videoBackground}
        autoPlay
        muted
        playsInline
      >
        <source src="/aerial.mp4" type="video/mp4" />
      </video>

      {/* Welcome Text */}
      <h1 className={`${styles.glowText} ${styles.fadeIn}`}>
        🕊️ Karibu <span className={styles.brand}>Lumina Outreach System</span>
      </h1>
      <p className={`${styles.subText} ${styles.fadeInDelay}`}>
        “Karibu mahali pa mwanga na uratibu.”
      </p>

      {/* User Options */}
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
      }
      
