import { NextResponse } from "next/server";
import speakeasy from "speakeasy";

export async function GET() {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: "Lumina Admin 2FA",
  });

  return NextResponse.json({
    base32: secret.base32,
    otpauth_url: secret.otpauth_url,
  });
}
