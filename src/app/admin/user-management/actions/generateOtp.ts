import { createClient } from "@supabase/supabase-js";
import { sendWhatsappOtp } from "../sendWhatsappOtp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateOtp(userId: number, phoneNumberWithCode: string, currentMeta: any) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const newMeta = {
    ...currentMeta,
    password_reset_otp: otp,
    reset_status: "waiting_approval",
    otp_expires_at: expiresAt,
    phone_number: phoneNumberWithCode,
  };

  const { data, error } = await supabase.from("users").update({ metadata: newMeta }).eq("id", userId).select("*").single();

  if (!error && data) {
    sendWhatsappOtp(phoneNumberWithCode, otp);
    return data;
  }
  return null;
}
