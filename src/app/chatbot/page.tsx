"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./chatbot.css"; // Make sure we will add CSS animations

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
  const [userInputName, setUserInputName] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    }
  }, [message]);

  const startChat = () => {
    setMessage("👋 Hello! Karibu Lumina, msaidizi wako. Tafadhali andika jina lako la kwanza na la pili:");
    setStep(1);
  };

  const handleNameInput = async (firstName: string, lastName: string) => {
    const fullNameInput = `${firstName} ${lastName}`.trim();
    setUserInputName([firstName, lastName]);

    const { data: foundUser } = await supabase
      .from("users")
      .select("id, full_name, email")
      .ilike("full_name", fullNameInput)
      .limit(1)
      .single();

    if (foundUser) {
      setUser({ id: foundUser.id, full_name: foundUser.full_name, email: foundUser.email });
      setMessage(`👋 Karibu ${foundUser.full_name}! Je unataka OTP kutoka kwa admin?`);
      setStep(2);
    } else {
      setMessage(`Ooh pole, hatukuweza kupata ${fullNameInput}. Tafadhali jaribu tena.`);
    }
  };

  const handleOtpAnswer = (answer: string) => {
    if (!user) return;

    if (answer.toLowerCase() === "ndiyo") {
      const textMessage = encodeURIComponent(
        `📩 Nimesahau nenosiri, naomba OTP.\nJina: ${user.full_name}\nEmail: ${user.email}`
      );
      const link = `https://wa.me/${ADMIN_WHATSAPP.replace("+", "")}?text=${textMessage}`;
      setWhatsappLink(link);
      setMessage(
        `Sawa! Bonyeza kitufe hapa kufungua WhatsApp na kutuma OTP kwa admin:`
      );
      setStep(4);
    } else {
      setMessage("Je tayari umeshajaza OTP?");
      setStep(3);
    }
  };

  const handleOtpConfirm = (answer: string) => {
    if (!user) return;

    if (answer.toLowerCase() === "ndiyo") {
      setMessage("✅ Nakuelekeza kwenye /update-password...");
      setTimeout(() => router.push("/update-password"), 1200);
    } else {
      setMessage("Sawa, tutarudi kwenye message ya karibu. Karibu tena!");
      setTimeout(() => startChat(), 1200);
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
            <p className="chat-message animate-slide-in">👋 Karibu! Naitwa Lumina, msaidizi wako.</p>
            <button className="start-btn animate-fade-in" onClick={startChat}>Anza</button>
          </>
        )}

        {message && <p className="chat-message animate-slide-in">{message}</p>}

        {step === 1 && (
          <div className="name-inputs animate-fade-in">
            <input id="firstName" placeholder="Jina la kwanza" />
            <input id="lastName" placeholder="Jina la pili" />
            <button
              onClick={() => {
                const first = (document.getElementById("firstName") as HTMLInputElement).value.trim();
                const last = (document.getElementById("lastName") as HTMLInputElement).value.trim();
                if (first && last) handleNameInput(first, last);
              }}
            >
              Tuma
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="btn-group animate-slide-in">
            <button onClick={() => handleOtpAnswer("ndiyo")}>Ndiyo</button>
            <button onClick={() => handleOtpAnswer("hapana")}>Hapana</button>
          </div>
        )}

        {step === 3 && (
          <div className="btn-group animate-slide-in">
            <button onClick={() => handleOtpConfirm("ndiyo")}>Ndiyo</button>
            <button onClick={() => handleOtpConfirm("hapana")}>Hapana</button>
          </div>
        )}

        {step === 4 && whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn animate-fade-in"
          >
            📩 Fungua WhatsApp kutuma OTP
          </a>
        )}

        {step === 5 && (
          <button className="success-btn animate-fade-in" onClick={handleSuccess}>
            Bonyeza hapa kuona tangazo la leo
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatBotPage;
    
