import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, role, branch, username, phone, profileUrl } = body;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Sign JWT (server-side)
    const token = jwt.sign({ email, role }, process.env.JWT_SECRET!, { expiresIn: "6h" });

    // Calculate active_until (6 months from now)
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    // Insert into users table
    const { error } = await supabase.from("users").insert({
      email,
      full_name: fullName,
      role,
      branch,
      username,
      phone,
      profile_url: profileUrl,
      password_hash: passwordHash,
      jwt_token: token,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      active_until: sixMonthsFromNow.toISOString(), // ✅ 6 months expiry
      metadata: {},
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ token }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
      }
