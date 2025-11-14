"use client";

import { useEffect, useState } from "react";
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

interface ChatSession {
  id?: string;
  user_id: string;
  current_step: number;
  status: "in_progress" | "success" | "failed";
  last_message?: string | null;
}

const ChatBotPage: React.FC = () => {
  const router = useRouter();

  // UI/state
  const [step, setStep] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  // Play notification sound on new message
  useEffect(() => {
    if (message) {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    }
  }, [message]);

  // Step machine messages (deterministic, non-AI)
  const copy = {
    welcome: "👋 Karibu! Tafadhali andika jina lako la kwanza na la pili ili tuhakikishe ni wewe.",
    notFound: (name: string) => `❌ Hatukupata: ${name}. Tafadhali jaribu tena.`,
    verified: (full_name: string) => `✅ Karibu ${full_name}! Chagua huduma hapa chini.`,
    menuInfo: "📋 Huduma zinazopatikana:",
    otpAsk: "Je unataka kuomba OTP kutoka kwa admin?",
    otpPromptWhatsApp: "Sawa! Bonyeza hapa kufungua WhatsApp na kutuma ujumbe kwa admin:",
    otpAlready: "Je tayari umeshajaza OTP?",
    updateRedirect: "✅ Nakuelekeza kwenye /update-password...",
    closing: (full_name?: string) =>
      `✅ Asante ${full_name || ""}! Umefika mwisho wa huduma hii. Tunakutakia siku njema.`,
    adminHelp: (phone: string) => `📞 Msaada kwa Admin: ${phone}`,
    resumeSuccess: "✅ Uliishia hatua ya mwisho na tayari umefanikiwa.",
    resumeFailed: "⚠️ Hatua haikukamilika mara ya mwisho. Tafadhali rudie au anza upya.",
  };

  // Load user (non-AI: first user or by name later)
  // Optional: you can remove this and rely only on name verification step
  useEffect(() => {
    const fetchInitialUser = async () => {
      // leave user null until verified by names
      setUser(null);
      setMessage(copy.welcome);
      setStep(1);
    };
    fetchInitialUser();
  }, []);

  // Fetch session for a verified user
  const loadSession = async (user_id: string) => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (!data) {
      setSession(null);
      setMessage(copy.verified(user!.full_name));
      setStep(2);
      return;
    }

    setSession(data);
    if (data.status === "success") {
      setMessage(copy.resumeSuccess);
      setStep(data.current_step);
    } else if (data.status === "failed") {
      setMessage(copy.resumeFailed);
      setStep(1);
    } else {
      setMessage(data.last_message || copy.menuInfo);
      setStep(data.current_step);
    }
  };

  // Upsert session
  const saveSession = async (payload: Partial<ChatSession>) => {
    if (!user) return;
    const toSave: ChatSession = {
      user_id: user.id,
      current_step: payload.current_step ?? step,
      status: (payload.status as ChatSession["status"]) ?? "in_progress",
      last_message: payload.last_message ?? message ?? null,
    };

    const { data } = await supabase.from("chat_sessions").upsert(toSave).select().single();
    setSession(data);
  };

  // Delete session
  const clearSession = async () => {
    if (!user) return;
    await supabase.from("chat_sessions").delete().eq("user_id", user.id);
    setSession(null);
  };

  // Step 1: verify name (deterministic)
  const handleNameVerify = async (firstName: string, lastName: string) => {
    const fullNameInput = `${firstName} ${lastName}`.trim();
    const { data: foundUser, error } = await supabase
      .from("users")
      .select("id, full_name, email")
      .ilike("full_name", fullNameInput)
      .limit(1)
      .single();

    if (error || !foundUser) {
      setMessage(copy.notFound(fullNameInput));
      setStep(1);
      return;
    }

    setUser({ id: foundUser.id, full_name: foundUser.full_name, email: foundUser.email });
    setMessage(copy.verified(foundUser.full_name));
    setStep(2);
    await saveSession({ current_step: 2, status: "in_progress", last_message: copy.menuInfo });
    await loadSession(foundUser.id);
  };

  // Menu actions (non-AI)
  const handleMenuSelect = (service: "otp" | "update" | "announce" | "admin") => {
    switch (service) {
      case "otp":
        setMessage(copy.otpAsk);
        setStep(21);
        saveSession({ current_step: 21, last_message: copy.otpAsk });
        break;
      case "update":
        setMessage(copy.updateRedirect);
        saveSession({ current_step: 99, status: "success", last_message: copy.updateRedirect });
        setTimeout(() => router.push("/update-password"), 1000);
        break;
      case "announce":
        setMessage(copy.closing(user?.full_name));
        setStep(90);
        saveSession({ current_step: 90, status: "success", last_message: copy.closing(user?.full_name) });
        setTimeout(async () => {
          await clearSession();
          setStep(0);
        }, 2500);
        break;
      case "admin":
        setMessage(copy.adminHelp(ADMIN_WHATSAPP));
        setStep(2);
        saveSession({ current_step: 2, last_message: copy.adminHelp(ADMIN_WHATSAPP) });
        break;
    }
  };

  // OTP branch (non-AI)
  const handleOtpAnswer = (answer: "ndiyo" | "hapana") => {
    if (!user) return;
    if (answer === "ndiyo") {
      const textMessage = encodeURIComponent(
        `📩 Nimesahau nenosiri, naomba OTP.\nJina: ${user.full_name}\nEmail: ${user.email}`
      );
      const link = `https://wa.me/${ADMIN_WHATSAPP.replace("+", "")}?text=${textMessage}`;
      setWhatsappLink(link);
      setMessage(copy.otpPromptWhatsApp);
      setStep(22);
      saveSession({ current_step: 22, last_message: copy.otpPromptWhatsApp });
    } else {
      setMessage(copy.otpAlready);
      setStep(23);
      saveSession({ current_step: 23, last_message: copy.otpAlready });
    }
  };

  const handleOtpConfirm = (answer: "ndiyo" | "hapana") => {
    if (answer === "ndiyo") {
      setMessage(copy.updateRedirect);
      saveSession({ current_step: 99, status: "success", last_message: copy.updateRedirect });
      setTimeout(() => router.push("/update-password"), 1000);
    } else {
      setMessage(copy.menuInfo);
      setStep(2);
      saveSession({ current_step: 2, status: "in_progress", last_message: copy.menuInfo });
    }
  };

  // Start button
  const start = () => {
    setMessage(copy.welcome);
    setStep(1);
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbox">
        {/* Welcome (first load or after clearing) */}
        {step === 0 && (
          <>
            <p className="chat-message animate-slide-in">👋 Karibu! Naitwa Lumina, msaidizi wako.</p>
            <button className="start-btn animate-fade-in" onClick={start}>Anza</button>
          </>
        )}

        {message && <p className="chat-message animate-slide-in">{message}</p>}

        {/* Step 1: Name verify */}
        {step === 1 && (
          <div className="name-inputs animate-fade-in">
            <input id="firstName" placeholder="Jina la kwanza" />
            <input id="lastName" placeholder="Jina la pili" />
            <button
              onClick={() => {
                const first = (document.getElementById("firstName") as HTMLInputElement).value.trim();
                const last = (document.getElementById("lastName") as HTMLInputElement).value.trim();
                if (first && last) handleNameVerify(first, last);
              }}
            >
              Thibitisha
            </button>
          </div>
        )}

        {/* Step 2: Service menu */}
        {step === 2 && (
          <>
            <p className="chat-message animate-slide-in">{copy.menuInfo}</p>
            <div className="btn-group animate-fade-in">
              <button onClick={() => handleMenuSelect("otp")}>OTP</button>
              <button onClick={() => handleMenuSelect("update")}>Update Password</button>
              <button onClick={() => handleMenuSelect("announce")}>Tangazo la Leo</button>
              <button onClick={() => handleMenuSelect("admin")}>Msaada kwa Admin</button>
            </div>
          </>
        )}

        {/* OTP branch: ask */}
        {step === 21 && (
          <div className="btn-group animate-slide-in">
            <button onClick={() => handleOtpAnswer("ndiyo")}>Ndiyo</button>
            <button onClick={() => handleOtpAnswer("hapana")}>Hapana</button>
          </div>
        )}

        {/* OTP branch: WhatsApp link */}
        {step === 22 && whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn animate-fade-in"
          >
            📩 Fungua WhatsApp kutuma OTP
          </a>
        )}

        {/* OTP branch: already filled? */}
        {step === 23 && (
          <div className="btn-group animate-slide-in">
            <button onClick={() => handleOtpConfirm("ndiyo")}>Ndiyo</button>
            <button onClick={() => handleOtpConfirm("hapana")}>Hapana</button>
          </div>
        )}

        {/* Closing states (e.g., 90 or 99 used above) */}
      </div>
    </div>
  );
};

export default ChatBotPage;
