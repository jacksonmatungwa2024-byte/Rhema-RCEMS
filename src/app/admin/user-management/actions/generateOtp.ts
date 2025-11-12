import { createClient } from "@supabase/supabase-js";
import { sendWhatsappOtp } from "../utils/sendWhatsappOtp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateOtp(user: any) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const newMeta = {
    ...user.metadata,
    password_reset_otp: otp,
    reset_status: "waiting_approval",
    otp_expires_at: expiresAt,
  };

  const { error } = await supabase
    .from("users")
    .update({ metadata: newMeta })
    .eq("id", user.id);

  if (error) {
    console.error(error);
    alert("❌ Haiwezekani kutengeneza OTP.");
    return;
  }

  // Tuma OTP WhatsApp
  await sendWhatsappOtp(user, otp);
  alert(`✅ OTP (${otp}) imetumwa kwa ${user.email} kupitia WhatsApp.`);
}
