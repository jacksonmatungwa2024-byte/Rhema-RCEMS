import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode"; // ✅ import sahihi

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password, full_name, role, branch, username, phone, profileUrl } = await req.json();

    if (!email || !full_name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 🔍 Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: "Email tayari imesajiliwa" }, { status: 400 });
    }

    // ⏳ Set active_until based on role
    let activeUntilDate: string | null = null;
    if (role === "admin") {
      activeUntilDate = null; // unlimited
    } else {
      const fallback = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      activeUntilDate = fallback.toISOString();
    }

    // 🔐 Ikiwa admin → tengeneza secret na QR code
    let totpSecret: string | null = null;
    let qrCodeDataUrl: string | null = null;

    if (role === "admin") {
      const secret = speakeasy.generateSecret({
        name: `Lumina App (${email})`, // jina litaonekana kwenye Google Authenticator
      });
      totpSecret = secret.base32;

      // Generate QR code image (Data URL)
      qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    }

    // ✅ Insert user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          full_name,
          role,
          branch,
          username,
          phone,
          profile_url: profileUrl,
          is_active: true,
          active_until: activeUntilDate,
          totp_secret: totpSecret, // only for admin
          metadata: { allowed_tabs: [] },
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 🎯 Ikiwa sio admin → JWT token moja kwa moja
    if (role !== "admin") {
      const token = jwt.sign(
        { email: data.email, role: data.role },
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
      );
      return NextResponse.json({ token, role: data.role });
    }

    // 🎯 Ikiwa admin → rudisha QR code kwa frontend
    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      message: "📲 Scan QR code kwa Google Authenticator na weka code ya tarakimu 6",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
