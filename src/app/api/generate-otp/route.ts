import { NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp";

export async function GET() {
  // Rudisha HTML yenye form ya kuingiza password
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Super Admin OTP</title>
        <style>
          body { font-family: sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; background:#111; color:#0f0; }
          .otp { font-size: 4rem; letter-spacing: 0.3rem; }
          input { padding: 10px; font-size: 1rem; }
        </style>
      </head>
      <body>
        <div>
          <h1>Super Admin OTP</h1>
          <form id="loginForm">
            <input type="password" id="password" placeholder="Enter password" />
            <button type="submit">Submit</button>
          </form>
          <div id="otp" class="otp"></div>
        </div>
        <script>
          const form = document.getElementById('loginForm');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pwd = document.getElementById('password').value;
            if (pwd !== "2021") {
              alert("Unauthorized");
              return;
            }
            // Fetch OTP JSON route
            async function updateOtp() {
              const res = await fetch('/api/generate-otp-json?password=2021');
              const data = await res.json();
              document.getElementById('otp').textContent = data.otp;
            }
            updateOtp();
            setInterval(updateOtp, 5000);
          });
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
