import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "User ID haijapewa" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 service role key
  );

  // 1️⃣ Get user metadata
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("metadata")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User haipo" }, { status: 404 });
  }

  const metadata = {
    ...user.metadata,
    reset_status: "approved",
    approved_at: new Date().toISOString(),
  };

  // 2️⃣ Update metadata
  const { error: updateError } = await supabase
    .from("users")
    .update({ metadata })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "OTP imeidhinishwa na admin" });
}
