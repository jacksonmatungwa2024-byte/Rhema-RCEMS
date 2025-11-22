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
    const { username, password, pin } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    // 🔍 Fetch user by username
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Akaunti haikupatikana." }, { status: 400 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Akaunti imefungwa." }, { status: 403 });
    }

    // 🔐 Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: "Nenosiri si sahihi." }, { status: 401 });
    }

    // 🔑 Admin PIN check (optional)
    if (user.role === "admin" && pin) {
      const validPin = await bcrypt.compare(pin, user.admin_pin_hash);
      if (!validPin) {
        return NextResponse.json({ error: "PIN ya admin si sahihi." }, { status: 401 });
      }
    }

    // 🎯 Generate JWT with username + role
    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "6h" }
    );

    // 🕒 Update last login
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json(
      { token, role: user.role, loginMode: pin ? "pin" : "normal" },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
