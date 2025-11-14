"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./chatbot.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_WHATSAPP = "+255626280792";

interface User {
  id: string;
  full_name: string;
  email: string;
}

const ChatBotPage: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Fetch first user (simulate logged-in user)
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email")
        .limit(1)
        .single();
      if (data) setUser({ id: data.id, full_name: data.full_name, email: data.email });
    };
    fetchUser();
  }, []);

  const startChat = () => {
    setMessage(`👋 Karibu ${user?.full_name || ""}! Naitwa Lumina, msaidizi wako.`);
    setTimeout(() => setStep(1), 1200);
  };

  const handleAnswer = async (answer: string) => {
    if (!user) return;

    if (step === 1) {
      if (answer.toLowerCase() === "ndiyo") {
        // simulate OTP existence check
        const otpExists = false; // change if already exists

        if (otpExists) {
          setMessage("✅ Tayari umeshajaza OTP, nakuelekeza /update-password...");
          setTimeout(() => router.push("/update-password"), 1500);
        } else {
          setMessage("Je unataka kujaza OTP?");
          setStep(2);
        }
      } else {
        setMessage("Ooh pole Ndugu, ikiwa unahitaji msaada zaidi unaweza kuwasiliana na admin.");
        setStep(0); // go back to hello state
      }
    } else if (step === 2) {
      if (answer.toLowerCase() === "ndiyo") {
        setMessage(`Sawa! Nitapeleka ujumbe kwa admin kwenye WhatsApp ${ADMIN_WHATSAPP}...`);
        setTimeout(() => {
          alert(`📩 Ujumbe umetumwa kwa admin:
Jina: ${user.full_name}
Email: ${user.email}
Ujumbe: "Nimesahau nenosiri, naomba OTP."`);
          router.push("/forgot-password");
        }, 1500);
      } else {
        setMessage("Sawa, nitakuondoa hapa. Karibu tena wakati wowote.");
        setTimeout(() => setStep(0), 2000);
      }
    }
  };

  const handleSuccess = () => {
    setMessage(
      `✅ Hakika ninakushukuru ${user?.full_name} kwa kuniamini! 
Naomba uzidi kumuamini Kristo. Wokovu mwema na moyo safi utakubariki. 
Bonyeza hapa kuona tangazo la leo.`
    );
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbox">
        {step === 0 && !message && (
          <>
            <p>👋 Karibu! Naitwa Lumina, msaidizi wako.</p>
            <button onClick={startChat}>Anza</button>
          </>
        )}

        {message && <p className="chat-message">{message}</p>}

        {step === 1 && message && (
          <div className="btn-group">
            <button onClick={() => handleAnswer("ndiyo")}>Ndiyo</button>
            <button onClick={() => handleAnswer("hapana")}>Hapana</button>
          </div>
        )}

        {step === 2 && message && (
          <div className="btn-group">
            <button onClick={() => handleAnswer("ndiyo")}>Ndiyo</button>
            <button onClick={() => handleAnswer("hapana")}>Hapana</button>
          </div>
        )}

        {step === 3 && (
          <button onClick={handleSuccess}>Bonyeza hapa kuona tangazo la leo</button>
        )}
      </div>
    </div>
  );
};

export default ChatBotPage;
          
