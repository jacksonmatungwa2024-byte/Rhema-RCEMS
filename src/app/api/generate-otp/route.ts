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
            width: 340px;
          }
          h1 {
            margin-bottom: 1rem;
            font-size: 1.5rem;
            color: #0288d1;
          }
          input {
            width: 100%;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border-radius: 8px;
            border: 1px solid #81d4fa;
            outline: none;
            font-size: 1rem;
          }
          button {
            width: 100%;
            padding: 0.75rem;
            border-radius: 8px;
            border: none;
            background: #0288d1;
            color: #fff;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
          }
          button:hover {
            background: #0277bd;
          }
          .otp {
            font-size: 3rem;
            letter-spacing: 0.3rem;
            margin-top: 1.5rem;
            color: #0288d1;
          }
          .countdown {
            margin-top: 0.5rem;
            font-size: 1rem;
            color: #ff9800;
          }
          .progress {
            margin-top: 0.5rem;
            width: 100%;
            height: 8px;
            background: #ddd;
            border-radius: 4px;
            overflow: hidden;
          }
          .progress-bar {
            height: 100%;
            background: #0288d1;
            width: 100%;
            transition: width 1s linear;
          }
          .error {
            margin-top: 1rem;
            font-size: 1rem;
            color: #d32f2f;
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
          <div id="countdown" class="countdown"></div>
          <div class="progress"><div id="progressBar" class="progress-bar"></div></div>
          <div id="error" class="error"></div>
        </div>
        <script>
          const form = document.getElementById('loginForm');
          const otpDiv = document.getElementById('otp');
          const countdownDiv = document.getElementById('countdown');
          const errorDiv = document.getElementById('error');
          const progressBar = document.getElementById('progressBar');

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pwd = document.getElementById('password').value;

            if (pwd !== "2021") {
              errorDiv.textContent = "❌ Wrong password!";
              return;
            }

            form.style.display = "none"; // hide form after login
            errorDiv.textContent = "";

            let step = 120; // 2 minutes
            let remaining = step;

            async function updateOtp() {
              try {
                const res = await fetch('/api/generate-otp-json?password=2021');
                if (!res.ok) {
                  errorDiv.textContent = "⚠️ Error: " + res.status + " " + res.statusText;
                  return;
                }
                const data = await res.json();
                if (!data.otp) {
                  errorDiv.textContent = "⚠️ No OTP returned!";
                  return;
                }
                otpDiv.textContent = data.otp;
                remaining = step; // reset countdown
                progressBar.style.width = "100%";
              } catch (err) {
                errorDiv.textContent = "⚠️ Server error: " + err.message;
              }
            }

            function tick() {
              countdownDiv.textContent = "⏳ Expires in " + remaining + "s";
              const percent = (remaining / step) * 100;
              progressBar.style.width = percent + "%";
              remaining--;
              if (remaining < 0) {
                updateOtp();
              }
            }

            updateOtp();
            setInterval(tick, 1000); // update countdown every second
          });
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
