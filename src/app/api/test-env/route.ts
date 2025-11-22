import { NextResponse } from "next/server";

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Env Vars Status</title>
        <style>
          body {
            font-family: Inter, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            color: #111;
            background: linear-gradient(270deg, #e0f7fa, #81d4fa, #29b6f6, #0288d1);
            background-size: 800% 800%;
            animation: waterFlow 30s ease infinite;
          }
          @keyframes waterFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .card {
            background: rgba(255, 255, 255, 0.9);
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            text-align: center;
            width: 400px;
          }
          h1 {
            margin-bottom: 1rem;
            font-size: 1.5rem;
            color: #0288d1;
          }
          .env {
            font-size: 1rem;
            margin: 0.5rem 0;
            padding: 0.5rem;
            border-radius: 6px;
            animation: fadeIn 2s ease;
          }
          .ok {
            background: #c8e6c9;
            color: #2e7d32;
          }
          .missing {
            background: #ffcdd2;
            color: #c62828;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Environment Variables</h1>
          <div class="env ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "ok" : "missing"}">
            NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "Loaded ✅" : "Missing ❌"}
          </div>
          <div class="env ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "ok" : "missing"}">
            NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Loaded ✅" : "Missing ❌"}
          </div>
          <div class="env ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "ok" : "missing"}">
            SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "Loaded ✅" : "Missing ❌"}
          </div>
          <div class="env ${process.env.JWT_SECRET ? "ok" : "missing"}">
            JWT_SECRET: ${process.env.JWT_SECRET ? "Loaded ✅" : "Missing ❌"}
          </div>
          <div class="env ${process.env.OTP_SECRET ? "ok" : "missing"}">
            OTP_SECRET: ${process.env.OTP_SECRET ? "Loaded ✅" : "Missing ❌"}
          </div>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
