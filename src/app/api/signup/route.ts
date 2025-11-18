import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use service role for inserts
);

// Define request body type
interface SignupRequest {
  phone: string;
  profileUrl: string;
  activeUntil: string; // ISO string from client
  allowedTabs: string[];
  email: string;
  role: string;
}

export async function POST(req: Request) {
  try {
    const body: SignupRequest = await req.json();
    const { phone, profileUrl, activeUntil, allowedTabs, email, role } = body;

    // Insert user into Supabase
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          phone,
          profile_url: profileUrl,
          is_active: true,
          active_until: new Date(activeUntil).toISOString(),
          metadata: { allowed_tabs: allowedTabs }, // ✅ store role panels
          email,
          role,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sign JWT with email + role
    const token = jwt.sign(
      { email: data.email, role: data.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    return NextResponse.json(
      { token, role: data.role, allowedTabs },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
                              }
