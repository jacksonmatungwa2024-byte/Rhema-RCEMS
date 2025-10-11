"use client"
import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import styles from "./welcome.module.css"

const WelcomePage: React.FC = () => {
  const router = useRouter()
  const [showButton, setShowButton] = useState(false)
  const [audioStarted, setAudioStarted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setAudioStarted(true)
      setTimeout(() => {
        router.push("/login")
      }, 21000)
    }
  }

  return (
    <div className={styles.container}>
      <video className={styles.videoBackground} autoPlay muted loop playsInline>
        <source src="/aerial.mp4" type="video/mp4" />
      </video>

      <div className={styles.glowText}>🌟 Karibu RCEMS Portal</div>
      <div className={styles.glowText}>ZOE isiyoisha uzima ndani yangu</div>
      <div className={styles.glowText}>
        “Nami nitawapa uzima wa milele, wala hawatapotea kamwe.” — Yohana 10:28
      </div>

      {showButton && !audioStarted && (
        <button className={styles.glowButton} onClick={handlePlay}>
          🔊 Play Theme
        </button>
      )}

      <audio ref={audioRef}>
        <source src="/theme.mp3" type="audio/mp3" />
      </audio>

      <div className={styles.footer}>
        &copy; Abel Memorial Programmers · RCEMS Legacy
      </div>
    </div>
  )
}

export default WelcomePage
