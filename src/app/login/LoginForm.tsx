"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="panel grid w-full max-w-sm gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">SignSeal Pricing Assist</h1>
        <p className="mt-1 text-sm text-steel">Login required. Users are created by an admin.</p>
      </div>
      {state?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <div className="grid gap-1">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-1">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="button" disabled={pending}>
        <LogIn size={16} /> {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
