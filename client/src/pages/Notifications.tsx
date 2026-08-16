import { EmptyPanel, formatDateTime, PageHeader } from "@/components/OperationsUI";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BellRing, CheckCheck } from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const utils = trpc.useUtils(); const { data: notifications, isLoading } = trpc.operations.notifications.list.useQuery();
  const markRead = trpc.operations.notifications.markRead.useMutation({ onSuccess: () => { void utils.operations.notifications.list.invalidate(); toast.success("Notification marked as read."); }, onError: (error) => toast.error(error.message) });
  return <div className="space-y-7"><PageHeader eyebrow="Team inbox" title="Assignment signals, recorded." description="Every task assignment and reassignment automatically becomes a contextual in-app notification for the responsible team member." />
    <section className="panel-surface rounded-xl border border-white/10 p-5 sm:p-6"><div className="divide-y divide-white/8">{isLoading ? <p className="py-12 text-center text-sm text-[#A99E8C]">Loading assignment notifications…</p> : notifications?.length ? notifications.map((note) => <article key={note.id} className="flex gap-4 py-5 first:pt-0"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#C9A84C]/25 bg-[#C9A84C]/10 text-[#C9A84C]"><BellRing className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium text-[#E8E0D0]">{note.title}</p><p className="mt-1 text-sm leading-6 text-[#A99E8C]">{note.content}</p><p className="mt-2 text-xs uppercase tracking-[.12em] text-[#847966]">For {note.recipientName} · {formatDateTime(note.createdAt)}</p></div>{!note.readAt && <Button onClick={() => markRead.mutate({ id: note.id })} variant="outline" size="sm" className="shrink-0 border-[#C9A84C]/25 text-[#F0D991] hover:bg-[#C9A84C]/10"><CheckCheck className="mr-2 h-3.5 w-3.5" />Mark read</Button>}</div></div></article>) : <EmptyPanel title="Nothing waiting for the team." description="Task assignments will automatically arrive here with the essential project, priority, and deadline context." />}</div></section>
  </div>;
}
