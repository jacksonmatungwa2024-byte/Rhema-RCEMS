import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ service role key
);

export async function POST(req: Request) {
  try {
    const {
      email,
      password,
      full_name,
      role,
      branch,
      username,
      phone,
      profileUrl,
    } = await req.json();

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Default active_until (6 months)
    const activeUntil = new Date();
    activeUntil.setMonth(activeUntil.getMonth() + 6);

    // 🔑 Define default allowed_tabs per role
    let allowedTabs: string[] = [];
    switch (role) {
      case "admin":
        allowedTabs = ["admin","usher","pastor","media","finance"];
        break;
      case "usher":
        allowedTabs = ["usher"];
        break;
      case "pastor":
        allowedTabs = ["pastor"];
        break;
      case "media":
        allowedTabs = ["media"];
        break;
      case "finance":
        allowedTabs = ["finance"];
        break;
      default:
        allowedTabs = ["profile"]; // fallback for normal user
        break;
    }

    // Insert user with metadata
    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        full_name,
        role: role || "user",
        branch,
        username,
        phone,
        profile_url: profileUrl,
        is_active: true,
        active_until: activeUntil.toISOString(),
        metadata: { allowed_tabs: allowedTabs }, // ✅ store role panels
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sign JWT
    const token = jwt.sign(
      { email: data.email, role: data.role },
      process.env.JWT_SECRET!,
      { expiresIn: "6h" }
    );

    return NextResponse.json({ token, role: data.role, allowedTabs }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
