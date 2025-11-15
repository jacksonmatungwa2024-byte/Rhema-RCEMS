import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role key for DB insert
);

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, fullName, role, branch, username, phone, profileUrl } = body;

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create JWT (server-side)
  const token = jwt.sign({ email, role }, process.env.JWT_SECRET!, { expiresIn: "6h" });

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
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ token }, { status: 200 });
                           }
