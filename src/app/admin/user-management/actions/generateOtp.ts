import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simulate sending OTP to WhatsApp
async function sendWhatsappOtp(phoneNumber: string, otp: string) {
  const message = `🔐 OTP yako ya kubadilisha nenosiri: ${otp} (Dakika 10).`;
  const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(waLink, "_blank")?.focus();
}

export async function generateOtp(userId: number, email: string, countryCode: string) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: userData, error } = await supabase
      .from("users")
      .select("metadata, phone_number")
      .eq("id", userId)
      .single();

    if (error || !userData) throw new Error("User not found");

    const newMeta = {
      ...userData.metadata,
      password_reset_otp: otp,
      reset_status: "waiting_approval",
      otp_expires_at: expiresAt,
    };

    await supabase.from("users").update({ metadata: newMeta }).eq("id", userId);

    const fullNumber = `${countryCode}${userData.phone_number || ""}`;
    await sendWhatsappOtp(fullNumber, otp);

    return { ...userData, metadata: newMeta };
  } catch (err) {
    console.error(err);
    alert("❌ Tatizo kutuma OTP.");
    return null;
  }
}
