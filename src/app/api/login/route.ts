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
    const { email, password, pin } = body;

    // If admin is logging in with PIN only
    if (pin) {
      const { data: adminUser, error: adminError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "admin")
        .single();

      if (adminError || !adminUser) {
        return NextResponse.json({ error: "Admin haijapatikana." }, { status: 400 });
      }

      const validPin = await bcrypt.compare(pin, adminUser.admin_pin_hash);
      if (!validPin) {
        return NextResponse.json({ error: "PIN ya admin si sahihi." }, { status: 401 });
      }

      const token = jwt.sign({ email: adminUser.email, role: "admin" }, process.env.JWT_SECRET!, {
        expiresIn: "6h",
      });

      return NextResponse.json({ token, role: "admin" }, { status: 200 });
    }

    // Normal user login with email + password
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Akaunti haijapatikana." }, { status: 400 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Akaunti yako imefungwa. Wasiliana na admin." }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: "Nenosiri si sahihi." }, { status: 401 });
    }

    const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: "6h",
    });

    return NextResponse.json({ token, role: user.role }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
        }
