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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const pushMessage = (text: string, author: "bot"|"user"="bot") =>
    setMessages((s) => [...s, { id: Date.now().toString(), author, text }]);

  const botReply = async (text: string) => {
    setTyping(true);
    await new Promise(r => setTimeout(r, 800));
    setTyping(false);
    pushMessage(text,"bot");
  };

  useEffect(() => { botReply("👋 Karibu! Tafadhali andika jina lako."); }, []);

  // verify name via API
  const handleNameVerify = async () => {
    const res = await fetch("/api/chatbot/name-verify", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ firstName:"Jackson", lastName:"Matungwa" }) // mfano
    });
    const result = await res.json();
    if(result.error){ botReply("❌ Hatukupata jina hilo."); return; }
    setUser(result.user);
    botReply(`✅ Karibu ${result.user.full_name}!`);
    setBranch("menu");
    botReply("📋 Huduma: 1) OTP  2) Update  3) Tangazo  4) Msaada");
  };

  const handleBranch = async (choice:string) => {
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
        const res = await fetch("/api/chatbot/announcement",{method:"POST"});
        const result = await res.json();
        if(result.error){ botReply("❌ Hakuna tangazo kwa sasa."); return; }
        botReply(`📣 Tangazo: ${result.announcement.title}\n${result.announcement.content}`);
        break;
      }
      case "help": {
        const res = await fetch("/api/chatbot/help",{method:"POST"});
        const result = await res.json();
        if(result.error){ botReply("❌ Hakuna msaada kwa sasa."); return; }
        botReply(`☎️ Msaada: ${result.contact}`);
        break;
      }
    }
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbox">
        <div className="messages" ref={scrollRef}>
          {messages.map(m=><div key={m.id} className={`bubble ${m.author}`}>{m.text}</div>)}
          {typing && <div className="bubble bot typing">...</div>}
        </div>

        <div className="controls">
          {branch==="welcome" && <button onClick={handleNameVerify}>Thibitisha Jina</button>}
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
