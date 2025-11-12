import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email haijapewa" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 service role key
  );

  // 1️⃣ Check if user exists
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, metadata")
    .eq("email", email)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "Email haijapatikana" }, { status: 404 });
  }

  // 2️⃣ Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 3️⃣ Update user metadata
  const metadata = {
    ...user.metadata,
    password_reset_otp: otp,
    reset_status: "waiting_approval",
    otp_generated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("users")
    .update({ metadata })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 4️⃣ Respond success
  return NextResponse.json({
    success: true,
    message: "OTP imezalishwa. Subiri admin athibitishe.",
    otp, // kwa development/testing, kwenye production usuhi OTP publicly
  });
}
