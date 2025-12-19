import express from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import config, { discord_oauth_client_id, discord_oauth_redirect, session_secret } from "./config";
import { fileURLToPath } from "url";
import session from 'express-session'
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.use(express.json());
app.set("trust proxy", 1);
app.use(
    session({
        secret: session_secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        }
    })
)


const renderLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 10,
  legacyHeaders: false,
  message: { error: "Hey there, you're way too fast for our systems to handle!" },
});

app.get(
    "/render-transcript/:id",
    renderLimiter,
    requireAuth,
    (req, res) => {
      const { id } = req.params;
  
      if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        return res.status(400).send("Invalid transcript ID");
      }
  
      const filePath = path.join(__dirname, "transcripts", `${id}.html`);
  
      if (!fs.existsSync(filePath)) {
        return res
          .status(404)
          .sendFile(path.join(__dirname, "pages", "error.html"));
      }
  
      return res.sendFile(filePath);
    }
  );
  



app.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
  
  app.get("/auth/discord", (req, res) => {
    const redirect = req.query.redirect as string | undefined;
  
    if (redirect) {
      req.session.oauth_redirect = redirect;
    }
  
    const oauthUrl =
      "https://discord.com/oauth2/authorize?" +
      new URLSearchParams({
        client_id: discord_oauth_client_id!,
        redirect_uri: discord_oauth_redirect!,
        response_type: "code",
        scope: "identify",
      }).toString();
  
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Freyr • Continue with Discord</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        
          <style>
            :root {
              --bg: #0b0d12;
              --card: #151823;
              --brand: #5865F2;
              --text: #e6e6f0;
              --muted: #9aa0b4;
            }
        
            * {
              box-sizing: border-box;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            }
        
            body {
              margin: 0;
              background: radial-gradient(1200px 600px at top, #1a1f33, var(--bg));
              color: var(--text);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
            }
        
            .card {
              background: linear-gradient(180deg, #181d2e, var(--card));
              border-radius: 16px;
              padding: 32px;
              max-width: 420px;
              width: 100%;
              box-shadow:
                0 20px 40px rgba(0,0,0,0.5),
                inset 0 1px 0 rgba(255,255,255,0.04);
              text-align: center;
              animation: fadeIn 0.3s ease-out;
            }
        
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
        
            .logo {
              font-weight: 800;
              font-size: 20px;
              letter-spacing: 0.6px;
              color: var(--brand);
              margin-bottom: 10px;
            }
        
            h1 {
              margin: 0;
              font-size: 26px;
            }
        
            p {
              margin-top: 12px;
              font-size: 15px;
              color: var(--muted);
              line-height: 1.5;
            }
        
            .hint {
              margin-top: 16px;
              padding: 12px 16px;
              border-radius: 12px;
              background: rgba(88,101,242,0.15);
              color: #cdd4ff;
              font-size: 14px;
              font-weight: 600;
            }
        
            .actions {
              margin-top: 24px;
              display: flex;
              justify-content: center;
            }
        
            a.button {
              text-decoration: none;
              padding: 12px 22px;
              border-radius: 12px;
              font-size: 15px;
              font-weight: 700;
              background: var(--brand);
              color: white;
              box-shadow: 0 10px 28px rgba(88,101,242,0.4);
              transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
        
            a.button:hover {
              transform: translateY(-1px);
              box-shadow: 0 14px 36px rgba(88,101,242,0.55);
            }
        
            footer {
              margin-top: 22px;
              font-size: 12px;
              color: #6f7694;
            }
          </style>
        </head>
        
        <body>
          <div class="card">
            <div class="logo">FREYR</div>
        
            <h1>Continue with Discord</h1>
        
            <p>
              To protect your account, Discord login must be completed
              in your web browser.
            </p>
        
            <div class="hint">
              🔐 This will open Discord in a new tab
            </div>
        
            <div class="actions">
              <a class="button" href="${oauthUrl}" target="_blank" rel="noopener">
                Continue with Discord
              </a>
            </div>
        
            <footer>
              Freyr Ticket System • Secure & Private
            </footer>
          </div>
        </body>
        </html>
        `);
        
  });
  app.get("/", (_req, res) => {
    res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Freyr • Ticket Transcripts</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  
    <style>
      :root {
        --bg: #0b0d12;
        --card: #151823;
        --brand: #5865F2;
        --text: #e6e6f0;
        --muted: #9aa0b4;
      }
  
      * {
        box-sizing: border-box;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      }
  
      body {
        margin: 0;
        background: radial-gradient(1200px 600px at top, #1a1f33, var(--bg));
        color: var(--text);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
  
      .card {
        background: linear-gradient(180deg, #181d2e, var(--card));
        border-radius: 16px;
        padding: 32px;
        max-width: 420px;
        width: 100%;
        box-shadow:
          0 20px 40px rgba(0,0,0,0.5),
          inset 0 1px 0 rgba(255,255,255,0.04);
        text-align: center;
        animation: fadeIn 0.3s ease-out;
      }
  
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
  
      .logo {
        font-weight: 800;
        font-size: 20px;
        letter-spacing: 0.6px;
        color: var(--brand);
        margin-bottom: 12px;
      }
  
      h1 {
        margin: 0;
        font-size: 26px;
      }
  
      p {
        margin-top: 12px;
        font-size: 15px;
        color: var(--muted);
        line-height: 1.5;
      }
  
      .hint {
        margin-top: 16px;
        padding: 12px 16px;
        border-radius: 12px;
        background: rgba(88,101,242,0.15);
        color: #cdd4ff;
        font-size: 14px;
        font-weight: 600;
      }
  
      .actions {
        margin-top: 24px;
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }
  
      a.button {
        text-decoration: none;
        padding: 10px 18px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        background: var(--brand);
        color: white;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        box-shadow: 0 8px 20px rgba(88,101,242,0.35);
      }
  
      a.button:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 28px rgba(88,101,242,0.45);
      }
  
      footer {
        margin-top: 20px;
        font-size: 12px;
        color: #6f7694;
      }
    </style>
  </head>
  
  <body>
    <div class="card">
      <div class="logo">FREYR</div>
  
      <h1>Ticket Transcripts</h1>
  
      <p>
        Securely view and download your ticket transcripts
        generated by the Freyr Discord bot.
      </p>
  
      <div class="hint">
        🔒 Transcript access must be opened from Discord
      </div>
  
      <div class="actions">
        <a class="button" href="https://discord.com/app">
          Open Discord
        </a>
      </div>
  
      <footer>
        Freyr Ticket System • Secure • Private
      </footer>
    </div>
  </body>
  </html>
    `);
  });
  


  app.get("/auth/discord/callback", async (req, res) => {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).send("No OAuth code provided");
    }
  
    try {
      const tokenRes = await axios.post(
        "https://discord.com/api/oauth2/token",
        new URLSearchParams({
          client_id: config.discord_oauth_client_id,
          client_secret: config.discord_oauth_client_scrt,
          grant_type: "authorization_code",
          code,
          redirect_uri: config.discord_oauth_redirect,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
  
      const accessToken = tokenRes.data.access_token;
  
      const userRes = await axios.get(
        "https://discord.com/api/users/@me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      req.session.user = {
        id: userRes.data.id,
        username: userRes.data.username,
        avatar: userRes.data.avatar,
      };
  
      const redirectTo = req.session.oauth_redirect || "/";
  
      delete req.session.oauth_redirect;
  
      res.redirect(redirectTo);
    } catch (err) {
      console.error("OAuth failed:", err);
      res.redirect("/login-failed");
    }
  });
  app.get("/login-failed", (_req, res) => {
    res.status(401).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Freyr • Login Failed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        
          <style>
            :root {
              --bg: #0b0d12;
              --card: #151823;
              --accent: #ff6b6b;
              --brand: #5865F2;
              --text: #e6e6f0;
              --muted: #9aa0b4;
            }
        
            * {
              box-sizing: border-box;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            }
        
            body {
              margin: 0;
              background: radial-gradient(1200px 600px at top, #1a1f33, var(--bg));
              color: var(--text);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
            }
        
            .card {
              background: linear-gradient(180deg, #181d2e, var(--card));
              border-radius: 16px;
              padding: 32px;
              max-width: 420px;
              width: 100%;
              box-shadow:
                0 20px 40px rgba(0,0,0,0.5),
                inset 0 1px 0 rgba(255,255,255,0.04);
              text-align: center;
              animation: fadeIn 0.3s ease-out;
            }
        
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
        
            .logo {
              font-weight: 800;
              font-size: 20px;
              letter-spacing: 0.6px;
              color: var(--brand);
              margin-bottom: 8px;
            }
        
            .icon {
              font-size: 56px;
              margin: 12px 0;
            }
        
            h1 {
              margin: 0;
              font-size: 24px;
            }
        
            p {
              margin-top: 12px;
              color: var(--muted);
              font-size: 15px;
              line-height: 1.5;
            }
        
            .reason {
              margin-top: 16px;
              padding: 10px 14px;
              border-radius: 10px;
              background: rgba(255,107,107,0.12);
              color: var(--accent);
              font-size: 14px;
              font-weight: 600;
            }
        
            .actions {
              margin-top: 24px;
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
            }
        
            a.button {
              text-decoration: none;
              padding: 10px 16px;
              border-radius: 10px;
              font-size: 14px;
              font-weight: 600;
              background: #1f2538;
              color: var(--text);
              border: 1px solid rgba(255,255,255,0.08);
              transition: background 0.15s ease, transform 0.15s ease;
            }
        
            a.button.primary {
              background: var(--brand);
              border-color: var(--brand);
              color: #fff;
            }
        
            a.button:hover {
              transform: translateY(-1px);
              background: #262c44;
            }
        
            footer {
              margin-top: 20px;
              font-size: 12px;
              color: #6f7694;
            }
          </style>
        </head>
        
        <body>
          <div class="card">
            <div class="logo">FREYR</div>
            <div class="icon">⚠️</div>
        
            <h1>Login Failed</h1>
        
            <p>
              We couldn’t verify your Discord account.
              This usually happens if the login was cancelled or expired.
            </p>
        
            <div class="reason">
              Error · Discord OAuth Authorization Failed
            </div>
        
            <div class="actions">
              <a class="button primary" href="/auth/discord">Try Again</a>
              <a class="button" href="/">Return</a>
            </div>
        
            <footer>
              Freyr Ticket System • Secure & Private
            </footer>
          </div>
        </body>
        </html>
        `);
        
  });
  


app.listen(config.ticket_handler_port, () => {
  console.log(
    `${chalk.green("[TICKET-SERVER]")} Listening on port ${config.ticket_handler_port}`
  );
});



function requireAuth(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (!req.session.user) {
      const redirectTo = encodeURIComponent(req.originalUrl);
      return res.redirect(`/auth/discord?redirect=${redirectTo}`);
    }
    next();
  }
  
  