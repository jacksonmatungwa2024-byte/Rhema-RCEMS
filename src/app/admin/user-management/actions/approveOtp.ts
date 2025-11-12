import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function approveOtp(userId: number, currentMeta: any) {
  const newMeta = { ...currentMeta, reset_status: "approved" };
  const { data, error } = await supabase.from("users").update({ metadata: newMeta }).eq("id", userId).select("*").single();
  if (!error) return data;
  return null;
}
