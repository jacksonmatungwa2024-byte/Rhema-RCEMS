"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./chatbot.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_WHATSAPP = "+255626280792"; // default admin WA

type Msg = {
  id: string;
  author: "bot" | "user";
  text: string;
  time?: string;
};

export default function ChatBotPage() {
  const router = useRouter();

  // UI state
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [user, setUser] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // helper: push message (bot or user)
  const pushMessage = (m: Msg) => {
    setMessages((s) => [...s, m]);
  };

  // play sound on bot message
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.author === "bot") {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    }
    // auto-scroll
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // initial welcome
  useEffect(() => {
    setTimeout(() => {
      pushMessage({
        id: Date.now().toString(),
        author: "bot",
        text: "👋 Karibu! Naitwa Lumina, msaidizi wako. Tafadhali andika jina lako la kwanza na la pili ili tujue wewe ni nani.",
        time: new Date().toISOString(),
      });
    }, 400);
  }, []);

  // simulate typing then push bot text
  const botReply = async (text: string) => {
    setTyping(true);
    // typing delay depends on length
    const delay = Math.min(1200 + text.length * 18, 2200);
    await new Promise((r) => setTimeout(r, delay));
    setTyping(false);
    pushMessage({
      id: Date.now().toString(),
      author: "bot",
      text,
      time: new Date().toISOString(),
    });
  };

  // name verify flow
  const handleNameVerify = async () => {
    const f = firstName.trim();
    const l = lastName.trim();
    if (!f || !l) {
      await botReply("❌ Tafadhali andika jina la kwanza na la pili.");
      return;
    }

    const full = `${f} ${l}`.trim();

    setTyping(true);
    // query DB for matching full_name (case-insensitive contains)
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email")
        .ilike("full_name", full)
        .limit(1)
        .single();

      if (error || !data) {
        setTyping(false);
        await botReply(`❌ Hatukupata: ${full}. Tafadhali jaribu tena.`);
        return;
      }

      setUser({ id: data.id, full_name: data.full_name, email: data.email });
      setTyping(false);
      await botReply(`✅ Karibu ${data.full_name}! Niko tayari kukusaidia.`);
      // show service menu
      setTimeout(() => setShowMenu(true), 300);
      await botReply("📋 Huduma: 1) Umesahau nenosiri (OTP)  2) Nilihifadhi password (Update)  3) Tangazo la leo  4) Wasiliana admin");
    } catch (err) {
      setTyping(false);
      await botReply("❌ Tatizo la seva. Tafadhali jaribu tena baadaye.");
      console.error(err);
    }
  };

  // menu handlers
  const handleRequestOtp = async () => {
    if (!user) {
      await botReply("❌ Tafadhali thibitisha jina kwanza.");
      return;
    }

    // build whatsapp link (message includes name+email)
    const msg = `📩 Nimesahau nenosiri, naomba OTP.%0AJina: ${encodeURIComponent(user.full_name)}%0AEmail: ${encodeURIComponent(
      user.email
    )}`;
    const link = `https://wa.me/${ADMIN_WHATSAPP.replace("+", "")}?text=${msg}`;
    setWhatsappLink(link);

    await botReply("Sawa! Bonyeza kitufe hapa chini kufungua WhatsApp na kutuma ujumbe kwa admin ili upokee OTP.");
    // show the WA button in UI
  };

  const handleAlreadyHaveOtp = async () => {
    if (!user) {
      await botReply("❌ Tafadhali thibitisha jina kwanza.");
      return;
    }
    // Ask whether user has OTP or wants to go to forgot-password
    await botReply("Je tayari umeshapokea OTP kutoka kwa admin?");
    setShowMenu(false);
    // present small yes/no UI via component buttons
    pushMessage({
      id: "bot-otp-prompt",
      author: "bot",
      text: "Chagua: NDIO (nimepata) / HAPANA (sihitaji)",
      time: new Date().toISOString(),
    });
  };

  const goToForgot = () => {
    router.push("/forgot-password");
  };

  const goToUpdate = () => {
    if (!user) {
      botReply("❌ Tafadhali thibitisha jina kwanza.");
      return;
    }
    router.push(`/update-password?email=${encodeURIComponent(user.email)}`);
  };

  // when user clicks WA button: open new tab and navigate to forgot page (don't alert)
  const openWhatsAppAndGotoForgot = () => {
    if (!whatsappLink) return;
    window.open(whatsappLink, "_blank");
    // leave chat and go to forgot page after small delay
    setTimeout(() => router.push("/forgot-password"), 800);
  };

  // small UI handlers for OTP confirmation choices
  const handleOtpChoice = async (choice: "ndiyo" | "hapana") => {
    if (choice === "ndiyo") {
      await botReply("✅ Nzuri — nakuelekeza kwenye ukurasa wa kuweka password mpya.");
      setTimeout(() => goToUpdate(), 900);
    } else {
      await botReply("Sawa — nitakuonyesha tena menu kuu.");
      setShowMenu(true);
    }
  };

  // helper render message bubble class
  const renderBubble = (m: Msg) => (
    <div key={m.id} className={`bubble ${m.author === "bot" ? "bot" : "user"}`}>
      <div className="bubble-text">{m.text}</div>
    </div>
  );

  return (
    <div className="chatbot-wrapper">
      <div className="chatbox">
        {/* avatar + header */}
        <div className="chat-header">
          <div className="avatar" aria-hidden>
            <div className="avatar-glow" />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="header-text">
            <div className="title">Lumina Msaidizi</div>
            <div className="subtitle">Karibu — msaada wa haraka</div>
          </div>
        </div>

        {/* messages area */}
        <div className="messages" ref={scrollRef}>
          {messages.map((m) => renderBubble(m))}

          {/* typing indicator */}
          {typing && (
            <div className="bubble bot typing">
              <div className="dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>

        {/* controls: name inputs or menu */}
        <div className="controls">
          {/* name input step */}
          {!user && (
            <div className="name-row">
              <input
                type="text"
                placeholder="Jina la kwanza"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-label="first-name"
              />
              <input
                type="text"
                placeholder="Jina la pili"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-label="last-name"
              />
              <button onClick={handleNameVerify}>Thibitisha</button>
            </div>
          )}

          {/* main menu */}
          {user && showMenu && (
            <div className="btn-group">
              <button onClick={() => { handleRequestOtp(); }}>
                📩 Omba OTP
              </button>
              <button onClick={() => { setShowMenu(false); botReply("Unaelekezwa..."); goToUpdate(); }}>
                🔐 Update Password
              </button>
              <button onClick={() => { botReply("Hakikisha kushiriki tangazo..."); router.push("/"); }}>
                📣 Tangazo
              </button>
              <button onClick={() => { botReply(`Msaada: ${ADMIN_WHATSAPP}`); }}>
                ☎️ Msaada
              </button>
            </div>
          )}

          {/* after ask OTP we show WA button */}
          {whatsappLink && (
            <div className="wa-row">
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="whatsapp-btn" onClick={openWhatsAppAndGotoForgot}>
                📩 Fungua WhatsApp & Tuma OTP kwa admin
              </a>
            </div>
          )}

          {/* when bot asked "already have OTP?" we show choices */}
          {messages.some((m) => m.id === "bot-otp-prompt") && (
            <div className="btn-group">
              <button onClick={() => handleOtpChoice("ndiyo")}>Ndiyo (Nimeshapatwa)</button>
              <button onClick={() => handleOtpChoice("hapana")}>Hapana</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
                    }
      
