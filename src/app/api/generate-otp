import { NextResponse } from "next/server";
import { generateOtp } from "@/src/lib/otp";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adminPassword = searchParams.get("password");

  if (adminPassword !== "2021") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.OTP_SECRET!;
  const otp = generateOtp(secret);

  return NextResponse.json({ otp });
}
