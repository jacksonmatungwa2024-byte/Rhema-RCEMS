import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email inahitajika." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, metadata")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Mtumiaji hajapatikana." }, { status: 404 });
    }

    // 🔢 Tengeneza OTP mpya
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // dakika 10

    const metadata = {
      ...user.metadata,
      password_reset_otp: otp,
      reset_status: "waiting_approval",
      otp_generated_at: new Date().toISOString(),
      otp_expires_at: expiry,
    };

    const { error: updateError } = await supabase
      .from("users")
      .update({ metadata })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Error updating OTP:", updateError);
      return NextResponse.json({ error: "Haiwezi kuhifadhi OTP." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "OTP imezalishwa. Inasubiri idhini ya admin.",
      otp,
      expires_at: expiry,
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    return NextResponse.json({ error: "Tatizo la ndani ya server." }, { status: 500 });
  }
}
