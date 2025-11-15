// app/api/me/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Fetch user info
    const { data: user, error } = await supabase
      .from("users")
      .select("email, role, full_name, branch, profile_url, last_login")
      .eq("email", decoded.email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role-based access map
    const accessMap: Record<string, string[]> = {
      admin: ["adminTab", "usherTab", "pastorTab", "mediaTab", "financeTab"],
      usher: ["usherTab"],
      pastor: ["pastorTab"],
      media: ["mediaTab"],
      finance: ["financeTab"],
    };

    const allowedTabs = accessMap[user.role] || [];

    return NextResponse.json({ ...user, allowedTabs }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
