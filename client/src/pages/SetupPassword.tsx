import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function SetupPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const setup = trpc.auth.setupPassword.useMutation({
    onSuccess: () => { toast.success("Your account is ready."); navigate("/"); },
    onError: (error) => toast.error(error.message),
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) { toast.error("Passwords do not match."); return; }
    setup.mutate({ token, password });
  };

  return <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center p-4"><div className="fixed inset-0 overflow-hidden pointer-events-none"><div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px]" /><div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-700/5 blur-[120px]" /></div><div className="relative w-full max-w-md"><div className="text-center mb-8"><img src="/royalmin.png" alt="Royal Edit Media House" className="mx-auto h-16 w-auto object-contain" /><h1 className="mt-5 text-2xl font-bold text-white">Set your password</h1><p className="mt-1 text-sm text-zinc-400">Activate your Royal Edit Operations Hub account.</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl">{!token ? <div className="space-y-5"><p className="text-sm leading-6 text-zinc-400">This invitation link is missing its secure token. Ask the Royal Edit administrator to resend your invitation.</p><Link href="/login" className="block text-center text-sm font-medium text-amber-500 hover:text-amber-400">Return to sign in</Link></div> : <form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium text-zinc-300">New password<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50" placeholder="At least 8 characters" /></label><label className="block text-sm font-medium text-zinc-300">Confirm password<input type="password" minLength={8} autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50" placeholder="Repeat your password" /></label><button type="submit" disabled={setup.isPending} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-60">{setup.isPending ? "Activating account…" : "Activate account"}</button></form>}</div></div></div>;
}
