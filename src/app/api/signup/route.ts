import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role key for inserts
);

interface SignupRequest {
  phone: string;
  profileUrl: string;
  activeUntil?: string; // optional
  allowedTabs: string[];
  email: string;
  role: string;
  full_name: string; // ✅ required
}

function isValidDate(dateStr: string) {
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export async function POST(req: Request) {
  try {
    const body: SignupRequest = await req.json();
    const { phone, profileUrl, activeUntil, allowedTabs, email, role, full_name } = body;

    // ✅ Validate required fields
    if (!full_name || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields: full_name, email, or role" },
        { status: 400 }
      );
    }

    // ⏳ Set active_until based on role
    let activeUntilDate: string | null = null;

    if (role === "admin") {
      activeUntilDate = null; // ✅ No limit for admins
    } else {
      if (activeUntil && isValidDate(activeUntil)) {
        activeUntilDate = new Date(activeUntil).toISOString(); // ✅ Use provided
      } else {
        const fallback = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 180 days
        activeUntilDate = fallback.toISOString(); // ✅ Default for non-admin
      }
    }

    // ✅ Insert into Supabase
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          phone,
          profile_url: profileUrl,
          is_active: true,
          active_until: activeUntilDate,
          metadata: { allowed_tabs: allowedTabs },
          email,
          role,
          full_name, // ✅ now included
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // ✅ Sign JWT
    const token = jwt.sign(
      { email: data.email, role: data.role, allowedTabs },
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
