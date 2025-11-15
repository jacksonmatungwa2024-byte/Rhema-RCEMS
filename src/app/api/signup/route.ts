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
    const { email, password, role } = await req.json();

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Default active_until (6 months)
    const activeUntil = new Date();
    activeUntil.setMonth(activeUntil.getMonth() + 6);

    // Insert user
    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        role: role || "user",
        is_active: true,
        active_until: activeUntil.toISOString(),
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

    return NextResponse.json({ token, role: data.role }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
