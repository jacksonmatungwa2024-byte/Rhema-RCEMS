import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function approveOtp(userId: number) {
  try {
    const { data: userData, error } = await supabase
      .from("users")
      .select("metadata")
      .eq("id", userId)
      .single();

    if (error || !userData) throw new Error("User not found");

    const newMeta = {
      ...userData.metadata,
      reset_status: "approved",
    };

    await supabase.from("users").update({ metadata: newMeta }).eq("id", userId);

    alert("✅ OTP imeidhinishwa. Mtumiaji sasa anaweza kuset nenosiri jipya.");
    return { ...userData, metadata: newMeta };
  } catch (err) {
    console.error(err);
    alert("❌ Tatizo kuthibitisha OTP.");
    return null;
  }
}
