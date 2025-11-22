import { NextResponse } from "next/server";

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Super Admin OTP</title>
        <style>
          body {
            font-family: Inter, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #0f0f0f;
            margin: 0;
            color: #e5e5e5;
          }
          .card {
            background: #1c1c1c;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            text-align: center;
            width: 320px;
          }
          h1 {
            margin-bottom: 1rem;
            font-size: 1.5rem;
            color: #00e676;
          }
          input {
            width: 100%;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border-radius: 8px;
            border: none;
            outline: none;
            font-size: 1rem;
          }
          button {
            width: 100%;
            padding: 0.75rem;
            border-radius: 8px;
            border: none;
            background: #00e676;
            color: #111;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
          }
          button:hover {
            background: #00c853;
          }
          .otp {
            font-size: 3rem;
            letter-spacing: 0.3rem;
            margin-top: 1.5rem;
            color: #00e676;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Super Admin OTP</h1>
          <form id="loginForm">
            <input type="password" id="password" placeholder="Enter password" />
            <button type="submit">Login</button>
          </form>
          <div id="otp" class="otp"></div>
        </div>
        <script>
          const form = document.getElementById('loginForm');
          const otpDiv = document.getElementById('otp');

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pwd = document.getElementById('password').value;

            if (pwd !== "2021") {
              alert("Unauthorized");
              return;
            }

            form.style.display = "none"; // hide form after login

            async function updateOtp() {
              const res = await fetch('/api/generate-otp-json?password=2021');
              const data = await res.json();
              otpDiv.textContent = data.otp;
            }

            updateOtp();
            setInterval(updateOtp, 5000); // refresh every 5s
          });
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
