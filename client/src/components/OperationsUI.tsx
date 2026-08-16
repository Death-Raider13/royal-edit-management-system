import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-5 border-b border-[#C9A84C]/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-label text-sm text-[#C9A84C]">{eyebrow}</p>
        <h1 className="font-display mt-1 text-4xl font-semibold leading-none text-[#E8E0D0] sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#BFB5A3]">{description}</p>
      </div>
      {action}
    </header>
  );
}

const statusStyles: Record<string, string> = {
  active: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  inactive: "border-zinc-500/30 bg-zinc-500/15 text-zinc-300",
  planned: "border-[#C9A84C]/25 bg-[#C9A84C]/10 text-[#F0D991]",
  in_progress: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  on_hold: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  completed: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-zinc-500/30 bg-zinc-500/15 text-zinc-300",
  not_started: "border-zinc-400/25 bg-zinc-400/10 text-zinc-300",
  blocked: "border-[#FF4D1C]/35 bg-[#FF4D1C]/10 text-[#FF8B6A]",
  low: "border-zinc-400/25 bg-zinc-400/10 text-zinc-300",
  medium: "border-[#C9A84C]/25 bg-[#C9A84C]/10 text-[#F0D991]",
  high: "border-[#FF4D1C]/35 bg-[#FF4D1C]/10 text-[#FF8B6A]",
};

export function StatusPill({ value }: { value: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.13em]", statusStyles[value] ?? statusStyles.inactive)}>{value.replaceAll("_", " ")}</span>;
}

export function MetricCard({ label, value, detail, icon: Icon, urgent = false }: { label: string; value: number | string; detail: string; icon: LucideIcon; urgent?: boolean }) {
  return (
    <section className="panel-surface relative overflow-hidden rounded-xl border border-white/10 p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/70 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-xs text-[#A99E8C]">{label}</p>
          <p className={cn("font-display mt-2 text-5xl leading-none", urgent ? "text-[#FF8B6A]" : "text-[#E8E0D0]")}>{value}</p>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-lg border", urgent ? "border-[#FF4D1C]/30 bg-[#FF4D1C]/10 text-[#FF8B6A]" : "border-[#C9A84C]/25 bg-[#C9A84C]/10 text-[#C9A84C]")}><Icon className="h-5 w-5" /></div>
      </div>
      <p className="mt-5 border-t border-white/8 pt-3 text-xs text-[#A99E8C]">{detail}</p>
    </section>
  );
}

export function EmptyPanel({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed border-[#C9A84C]/25 bg-black/15 p-8 text-center"><p className="font-display text-2xl text-[#E8E0D0]">{title}</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#A99E8C]">{description}</p></div>;
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
