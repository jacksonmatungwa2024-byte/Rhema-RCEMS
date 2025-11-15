import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const plainPin = "2017"; // PIN ya admin
    const hashedPin = await bcrypt.hash(plainPin, 10);

    const { error } = await supabase
      .from("users")
      .update({ admin_pin_hash: hashedPin })
      .eq("role", "admin");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "✅ Admin PIN hashed and saved successfully!" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
