// src/app/api/admin/generate-otp/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // service key for admin ops
);

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email inahitajika" }, { status: 400 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // random 6 digits
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins expiry

  const { error } = await supabase
    .from("users")
    .update({
      metadata: {
        password_reset_otp: otp,
        reset_status: "waiting_approval",
        otp_expires_at: expiresAt,
      },
    })
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `OTP ${otp} imetumwa kwa ${email} na ita-expire baada ya dakika 10.`,
  });
}
