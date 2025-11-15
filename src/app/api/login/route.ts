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
    const { email, password, pin } = await req.json();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Akaunti haikupatikana." }, { status: 400 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Akaunti imefungwa." }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: "Nenosiri si sahihi." }, { status: 401 });
    }

    if (user.role === "admin" && pin) {
      const validPin = await bcrypt.compare(pin, user.admin_pin_hash);
      if (!validPin) {
        return NextResponse.json({ error: "PIN ya admin si sahihi." }, { status: 401 });
      }
    }

    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "6h" }
    );

    await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id);

    return NextResponse.json({ token, role: user.role, loginMode: pin ? "pin" : "normal" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
