import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID inahitajika." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("metadata")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "Mtumiaji hajapatikana." }, { status: 404 });
    }

    const metadata = {
      ...user.metadata,
      reset_status: "approved_by_admin",
      approved_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("users")
      .update({ metadata })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ Error approving OTP:", updateError);
      return NextResponse.json({ error: "Haiwezi kuidhinisha OTP." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP imeidhinishwa na admin." });
  } catch (err) {
    console.error("❌ Server error:", err);
    return NextResponse.json({ error: "Tatizo la ndani ya server." }, { status: 500 });
  }
}
