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

    // Fetch user info including metadata
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role, full_name, branch, profile_url, last_login, metadata")
      .eq("email", decoded.email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Define all possible panels and tabs
    const allPanels = ["admin", "usher", "pastor", "media", "finance"];
    const allTabIds = [
      "tabManager", "reactivation", "users", "registration", "data", "matangazo",
      "storage", "settings", "profile",
      "home", "usajili", "mafunzo", "reports", "messages", "picha",
      "muumini", "mahadhurio", "wokovu", "ushuhuda",
      "dashboard", "bajeti", "summary", "approval", "approved", "rejected",
      "media", "usage", "finance", "michango", "reports_finance"
    ];

    let allowedTabs: string[] = [];

    if (user.role === "admin") {
      // Admin gets everything
      allowedTabs = [...allPanels, ...allTabIds];
    } else if (user.role === "usher") {
      allowedTabs = ["usher", ...(user.metadata?.allowed_tabs || [])];
    } else if (user.role === "pastor") {
      allowedTabs = ["pastor", ...(user.metadata?.allowed_tabs || [])];
    } else if (user.role === "media") {
      allowedTabs = ["media", ...(user.metadata?.allowed_tabs || [])];
    } else if (user.role === "finance") {
      allowedTabs = ["finance", ...(user.metadata?.allowed_tabs || [])];
    } else {
      // fallback
      allowedTabs = user.metadata?.allowed_tabs || [];
    }

    return NextResponse.json({ ...user, allowedTabs }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
