"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UpdatePassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const updatePassword = async () => {
    if (!password || password.length < 6) {
      setStatus("❌ Nenosiri lazima liwe angalau herufi 6.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("❌ Tatizo katika kubadilisha nenosiri: " + error.message);
    } else {
      setStatus("✅ Nenosiri limebadilishwa kikamilifu!");
      router.push("/login");
    }
  };

  return (
    <div className="update-container">
      <h2>🔒 Badilisha Nenosiri kwa {email}</h2>
      <input
        type="password"
        placeholder="Nenosiri jipya"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input-field"
      />
      <button onClick={updatePassword} className="btn btn-update">
        💾 Hifadhi
      </button>
      {status && <div className="status">{status}</div>}
    </div>
  );
}
