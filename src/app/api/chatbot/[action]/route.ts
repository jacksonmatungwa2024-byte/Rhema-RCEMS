import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_WHATSAPP = "+255626280792";

/* ---------- POST HANDLER ---------- */
export async function POST(
  request: NextRequest,
  context: { params: { action: string } }   // ✅ object, not Promise
) {
  try {
    const { action } = context.params;     // ✅ no await
    const body = await request.json();

    switch (action) {
      case "name-verify": {
        const { firstName, lastName } = body;
        if (!firstName || !lastName) {
          return NextResponse.json({ error: "Missing names" }, { status: 400 });
        }
        const full = `${firstName} ${lastName}`.trim();
        const { data, error } = await supabase
          .from("users")
          .select("id, full_name, email")
          .ilike("full_name", full)
          .limit(1)
          .single();
        if (error || !data) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ user: data }, { status: 200 });
      }

      case "request-otp": {
        const { full_name, email } = body;
        if (!full_name || !email) {
          return NextResponse.json({ error: "Missing user details" }, { status: 400 });
        }
        const msg = `📩 Nimesahau nenosiri, naomba OTP.%0AJina: ${encodeURIComponent(
          full_name
        )}%0AEmail: ${encodeURIComponent(email)}`;
        const link = `https://wa.me/${ADMIN_WHATSAPP.replace("+", "")}?text=${msg}`;
        return NextResponse.json({ whatsappLink: link }, { status: 200 });
      }

      default:
        return NextResponse.json({ error: "Unknown POST action" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ---------- GET HANDLER ---------- */
export async function GET(
  request: NextRequest,
  context: { params: { action: string } }   // ✅ object, not Promise
) {
  try {
    const { action } = context.params;     // ✅ no await

    switch (action) {
      case "announcement": {
        const { data, error } = await supabase
          .from("announcements")
          .select("id, title, content, created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (error || !data) {
          return NextResponse.json(
            { error: "Hakuna tangazo lililopatikana" },
            { status: 404 }
          );
        }
        return NextResponse.json({ announcement: data }, { status: 200 });
      }

      case "help": {
        return NextResponse.json(
          { contact: ADMIN_WHATSAPP, message: "Wasiliana na admin kupitia WhatsApp" },
          { status: 200 }
        );
      }

      default:
        return NextResponse.json({ error: "Unknown GET action" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
                                    }
