import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function approveOtp(user: any) {
  const meta = user.metadata || {};
  const expiresAt = new Date(meta.otp_expires_at || "");
  if (expiresAt < new Date()) {
    alert("⌛ OTP hii imeisha muda wake.");
    return;
  }

  const newMeta = { ...meta, reset_status: "approved" };
  const { error } = await supabase
    .from("users")
    .update({ metadata: newMeta })
    .eq("id", user.id);

  if (error) {
    console.error(error);
    alert("❌ Haijaidhinishwa.");
    return;
  }

  alert(`✅ OTP imeidhinishwa kwa ${user.email}.`);
}
