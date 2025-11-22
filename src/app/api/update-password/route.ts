import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { username, new_password } = await req.json();

    if (!username || !new_password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    // 🔍 Fetch user by username
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, otp_verified, metadata")
      .eq("username", username)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔐 Check OTP verified
    if (!user.otp_verified) {
      return NextResponse.json({ error: "OTP haijathibitishwa." }, { status: 403 });
    }

    // 🔒 Hash new password
    const passwordHash = await bcrypt.hash(new_password, 10);

    // ✅ Update password and clear OTP metadata
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        otp_verified: false,
        metadata: {
          ...user.metadata,
          password_reset_otp: null,
          otp_expires_at: null,
          reset_status: null,
        },
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
