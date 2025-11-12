import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email na OTP vinahitajika." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user, error } = await supabase
      .from("users")
      .select("metadata")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Mtumiaji hajapatikana." }, { status: 404 });
    }

    const storedOtp = user.metadata?.password_reset_otp;
    const resetStatus = user.metadata?.reset_status;

    if (storedOtp === otp && resetStatus === "approved_by_admin") {
      return NextResponse.json({
        success: true,
        message: "OTP imeidhinishwa na admin.",
      });
    }

    if (storedOtp === otp && resetStatus === "waiting_approval") {
      return NextResponse.json({
        success: false,
        message: "OTP sahihi, lakini bado inasubiri idhini ya admin.",
      });
    }

    return NextResponse.json({
      success: false,
      message: "OTP si sahihi au imekwisha muda.",
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    return NextResponse.json({ error: "Tatizo la ndani ya server." }, { status: 500 });
  }
}
