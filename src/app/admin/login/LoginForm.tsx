"use client";
import { startTransition, useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, run, pending] = useActionState(login, undefined);
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => run(fd)); }} className="form">
      <div className="field"><label htmlFor="username">Username</label><input className="input" id="username" name="username" autoComplete="username" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {state?.error && <div className="notice bad" role="alert">{state.error}</div>}
      <button className="btn" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
