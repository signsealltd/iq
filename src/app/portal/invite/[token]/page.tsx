import { acceptPortalInvitation } from "./actions";
import { SignSealLogo } from "@/components/SignSealLogo";

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const query = await searchParams;
  return <main className="min-h-screen bg-page px-4 py-8 text-ink"><section className="mx-auto grid max-w-md gap-4"><SignSealLogo /><div className="panel p-5"><h1 className="text-xl font-bold">Create your portal password</h1><p className="mt-2 text-sm text-steel">Set a password to access your SignSeal project portal. This link can only be used while it is active.</p>{query.error ? <p className="mt-3 rounded-md border border-amber/40 bg-amber/10 p-3 text-sm text-amber">{query.error}</p> : null}<form action={acceptPortalInvitation} className="mt-4 grid gap-3"><input type="hidden" name="token" value={token} /><label className="grid gap-1"><span>Password</span><input name="password" type="password" minLength={10} required /></label><label className="grid gap-1"><span>Confirm password</span><input name="confirmPassword" type="password" minLength={10} required /></label><button className="button">Activate portal access</button></form></div></section></main>;
}

