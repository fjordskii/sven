"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action}>
      <h1>Needs Ford</h1>
      <p>What the agents are waiting on you for.</p>
      <input
        type="password"
        name="password"
        placeholder="Password"
        autoComplete="current-password"
        aria-label="Password"
        required
        autoFocus
      />
      {state.error ? <div className="err">{state.error}</div> : null}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
