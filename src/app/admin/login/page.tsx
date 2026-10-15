import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { adminConfigured } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  const ok = adminConfigured();
  return (
    <div className="login">
      <div className="login-card">
        <span className="eyebrow">Owner &amp; staff</span>
        <h1 style={{ fontSize: "2rem" }}>Sign in</h1>
        {ok ? <LoginForm /> : (
          <div className="notice warn">
            <b>Admin is not set up yet.</b> Create <code>.env.local</code> from <code>.env.example</code> and set <code>ADMIN_PASSWORD</code> (not the placeholder) and <code>SESSION_SECRET</code> (16+ characters), then restart the server. See the README.
          </div>
        )}
      </div>
    </div>
  );
}
