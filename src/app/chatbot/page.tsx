"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./chatbot.css";

type Msg = { id: string; author: "bot" | "user"; text: string };

export default function ChatBotPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);
  const [branch, setBranch] = useState<"welcome"|"menu"|"otp">("welcome");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const pushMessage = (text: string, author: "bot"|"user"="bot") =>
    setMessages((s) => [...s, { id: Date.now().toString(), author, text }]);

  const botReply = async (text: string) => {
    setTyping(true);
    await new Promise(r => setTimeout(r, 800));
    setTyping(false);
    pushMessage(text,"bot");
  };

  // welcome message
  useEffect(() => { 
    botReply(`👋 Karibu! Naitwa Lumina chatbot msaidizi wako wa kukuhudumia, tafadhali naomba ushirikiano wako sana 😊🙏♥️
Tafadhali andika jina lako la kwanza kisha jaza na la pili, kama ulivyojisajili awali kwenye Usajili 🤗`); 
  }, []);

  // auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // verify name via API (POST)
  const handleNameVerify = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      botReply("❌ Tafadhali jaza jina la kwanza na la pili.");
      return;
    }

    try {
      const res = await fetch("/api/chatbot/name-verify", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ firstName, lastName })
      });
      const result = await res.json();
      if(result.error){ botReply("❌ Hatukupata jina hilo."); return; }
      setUser(result.user);
      botReply(`✅ Karibu ${result.user.full_name}!`);
      setBranch("menu");
      botReply(`📋 ${result.user.full_name}, chagua huduma: 1) OTP  2) Update  3) Tangazo  4) Msaada`);
    } catch {
      botReply("⚠️ Tatizo la mtandao, jaribu tena.");
    }
  };

  const handleBranch = async (choice:string) => {
    try {
      switch(choice){
        case "otp": {
          const res = await fetch("/api/chatbot/request-otp", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({ full_name:user?.full_name, email:user?.email })
          });
          const result = await res.json();
          if(result.error){ botReply("❌ Tatizo: "+result.error); return; }
          setBranch("otp");
          botReply("📩 Bonyeza kitufe kuomba OTP kwa admin.");
          pushMessage(result.whatsappLink,"bot");
          break;
        }
        case "update":
          router.push(`/update-password?email=${encodeURIComponent(user?.email||"")}`);
          break;
        case "announcement": {
          const res = await fetch("/api/chatbot/announcement"); // ✅ GET
          const result = await res.json();
          if(result.error){ botReply("❌ Hakuna tangazo kwa sasa."); return; }
          botReply(`📣 Tangazo: ${result.announcement.title}\n${result.announcement.content}`);
          break;
        }
        case "help": {
          const res = await fetch("/api/chatbot/help"); // ✅ GET
          const result = await res.json();
          if(result.error){ botReply("❌ Hakuna msaada kwa sasa."); return; }
          botReply(`☎️ Msaada: ${result.contact}`);
          break;
        }
      }
    } catch {
      botReply("⚠️ Tatizo la mtandao, jaribu tena.");
    }
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbox">
        <div className="messages" ref={scrollRef}>
          {messages.map(m=><div key={m.id} className={`bubble ${m.author}`}>{m.text}</div>)}
          {typing && (
            <div className="bubble bot typing">
              <div className="dots"><span></span><span></span><span></span></div>
            </div>
          )}
        </div>

        <div className="controls">
          {branch==="welcome" && (
            <div className="name-row">
              <input
                type="text"
                placeholder="Jina la kwanza"
                value={firstName}
                onChange={(e)=>setFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Jina la pili"
                value={lastName}
                onChange={(e)=>setLastName(e.target.value)}
              />
              <button onClick={handleNameVerify}>Thibitisha Jina</button>
            </div>
          )}

          {branch==="menu" && (
            <div className="btn-group">
              <button onClick={()=>handleBranch("otp")}>📩 OTP</button>
              <button onClick={()=>handleBranch("update")}>🔐 Update</button>
              <button onClick={()=>handleBranch("announcement")}>📣 Tangazo</button>
              <button onClick={()=>handleBranch("help")}>☎️ Msaada</button>
            </div>
          )}

          {branch==="otp" && (
            <a href={messages.find(m=>m.text.startsWith("https://wa.me"))?.text} target="_blank" className="whatsapp-btn">
              Fungua WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
