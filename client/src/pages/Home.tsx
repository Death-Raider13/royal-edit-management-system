import { EmptyPanel, formatDateTime, MetricCard, PageHeader } from "@/components/OperationsUI";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, BriefcaseBusiness, CircleUserRound, Sparkles, UsersRound } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data, isLoading } = trpc.operations.dashboard.useQuery();
  const stats = data?.stats;
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Command Centre" title="The work, in focus." description="A concise view of Royal Edit’s capacity, client relationships, active work, and deadlines that need attention." />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Team capacity" value={isLoading ? "—" : stats?.totalStaff ?? 0} detail="People available in the workspace" icon={UsersRound} />
        <MetricCard label="Client roster" value={isLoading ? "—" : stats?.totalClients ?? 0} detail="Managed client relationships" icon={CircleUserRound} />
        <MetricCard label="Active projects" value={isLoading ? "—" : stats?.activeProjects ?? 0} detail="Currently moving through delivery" icon={BriefcaseBusiness} />
        <MetricCard label="Overdue tasks" value={isLoading ? "—" : stats?.overdueTasks ?? 0} detail="Tasks that require a prompt response" icon={AlertTriangle} urgent />
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        <div className="panel-surface rounded-xl border border-white/10 p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="font-label text-sm text-[#C9A84C]">Recent activity</p><h2 className="font-display mt-1 text-3xl text-[#E8E0D0]">Workspace pulse</h2></div><Sparkles className="h-5 w-5 text-[#C9A84C]" /></div><div className="mt-6 divide-y divide-white/8">{isLoading ? <p className="py-8 text-center text-sm text-[#A99E8C]">Loading current activity…</p> : data?.recentActivity.length ? data.recentActivity.map((item) => <article key={item.id} className="flex gap-4 py-4 first:pt-0"><div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C9A84C] shadow-[0_0_12px_rgba(201,168,76,.75)]" /><div className="min-w-0 flex-1"><p className="text-sm leading-6 text-[#E8E0D0]">{item.description}</p><p className="mt-1 text-xs uppercase tracking-[.12em] text-[#847966]">{item.action.replaceAll("_", " ")} · {formatDateTime(item.createdAt)}</p></div></article>) : <EmptyPanel title="The story starts here." description="Add a team member, client, project, or task to begin building your operations timeline." />}</div></div>
        <aside className="brand-grid rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-6"><p className="font-label text-sm text-[#C9A84C]">Next move</p><h2 className="font-display mt-2 text-4xl leading-[.95] text-[#E8E0D0]">Build a clear line from brief to delivery.</h2><p className="mt-5 text-sm leading-6 text-[#BFB5A3]">Start by registering the people and clients that power the work. Then create projects, assign actions, and let the workspace keep the momentum visible.</p><div className="mt-7 space-y-3">{[["01", "Add your team", "/team"], ["02", "Register a client", "/clients"], ["03", "Create a project", "/projects"]].map(([number, label, path]) => <Link key={path} href={path} className="group flex items-center justify-between rounded-lg border border-[#C9A84C]/15 bg-black/25 px-4 py-3 text-sm text-[#E8E0D0] transition-colors hover:border-[#C9A84C]/45 hover:bg-[#C9A84C]/10"><span><span className="font-label mr-3 text-[#C9A84C]">{number}</span>{label}</span><span className="text-[#C9A84C] transition-transform group-hover:translate-x-1">→</span></Link>)}</div></aside>
      </section>
    </div>
  );
}
