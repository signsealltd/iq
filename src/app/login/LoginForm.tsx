"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { SignSealLogo } from "@/components/SignSealLogo";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action} className="panel grid w-full max-w-md gap-5 p-5 sm:p-6">
      <div className="grid gap-4">
        <SignSealLogo />
        <div>
          <h1 className="text-2xl font-semibold">SignSeal IQ</h1>
          <p className="mt-1 text-sm text-steel">Internal pricing and business management</p>
        </div>
      </div>
      {state?.error ? <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p> : null}
      <div className="grid gap-1.5">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required placeholder="name@signseal.co.uk" />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="password">Password</label>
        <div className="relative">
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="w-full pr-12" />
          <button
            className="focus-ring absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-steel hover:bg-panel hover:text-ink"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
      <button className="button" disabled={pending}>
        <LogIn size={16} /> {pending ? "Signing in" : "Sign in"}
      </button>
      <p className="text-xs text-steel">No public registration. Users are created by an administrator.</p>
    </form>
  );
}