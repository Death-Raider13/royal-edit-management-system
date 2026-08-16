import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { cn } from "@/lib/utils";
import { Bell, BriefcaseBusiness, ChartNoAxesCombined, ChevronRight, CircleUserRound, LayoutDashboard, LogOut, UsersRound, Workflow } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";

const logoUrl = "/manus-storage/royal-edit-primary-logo_16bef8d9.png";
const navigation = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Team", path: "/team", icon: UsersRound },
  { label: "Clients", path: "/clients", icon: CircleUserRound },
  { label: "Projects", path: "/projects", icon: BriefcaseBusiness },
  { label: "Tasks", path: "/tasks", icon: Workflow },
  { label: "Reports", path: "/reports", icon: ChartNoAxesCombined },
  { label: "Inbox", path: "/notifications", icon: Bell },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#080808]"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" /></div>;
  if (!user) {
    return <main className="brand-grid grid min-h-screen place-items-center bg-[#080808] p-6"><section className="panel-surface w-full max-w-md rounded-2xl border border-[#C9A84C]/25 p-9 text-center"><img src={logoUrl} alt="Royal Edit Media House" className="mx-auto h-28 w-auto object-contain" /><div className="gold-line mx-auto mt-5 h-px w-28" /><h1 className="font-display mt-7 text-4xl text-[#E8E0D0]">Operations Hub</h1><p className="mt-3 text-sm leading-6 text-[#A99E8C]">Secure access for the Royal Edit team, client, project, and task workspace.</p><Button onClick={() => startLogin()} className="mt-8 w-full bg-[#C9A84C] text-[#080808] hover:bg-[#E8E0D0]">Enter workspace <ChevronRight className="ml-1 h-4 w-4" /></Button></section></main>;
  }

  const active = navigation.find((item) => item.path === location)?.label ?? "Operations";
  return (
    <div className="min-h-screen bg-[#080808] text-[#E8E0D0] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-[#C9A84C]/15 bg-[#060606]/95 px-4 py-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="flex items-center gap-3 px-1"><img src={logoUrl} alt="Royal Edit Media House" className="h-12 w-16 object-contain object-left" /><div className="min-w-0"><p className="font-label text-xs text-[#C9A84C]">Royal Edit</p><p className="text-[10px] uppercase tracking-[.18em] text-[#A99E8C]">Operations Hub</p></div></div>
        <div className="gold-line my-5 h-px w-full lg:my-7" />
        <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {navigation.map(({ label, path, icon: Icon }) => <button key={path} onClick={() => setLocation(path)} className={cn("group flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 active:scale-[.98]", location === path ? "bg-[#C9A84C]/12 text-[#F0D991]" : "text-[#A99E8C] hover:bg-white/5 hover:text-[#E8E0D0]")}><Icon className={cn("h-4 w-4", location === path ? "text-[#C9A84C]" : "text-[#847966]")} /><span>{label}</span>{location === path && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-[#C9A84C] lg:block" />}</button>)}
        </nav>
        <div className="mt-auto hidden rounded-xl border border-[#C9A84C]/15 bg-[#C9A84C]/5 p-3 lg:block"><p className="font-label text-xs text-[#C9A84C]">System focus</p><p className="mt-1 text-xs leading-5 text-[#BFB5A3]">Clear priorities. Strong execution. A full view of what moves the work forward.</p></div>
        <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-[#E8E0D0]">{user.name || "Royal Edit User"}</p><p className="truncate text-xs text-[#847966]">{user.email || "Signed in"}</p></div><Button variant="ghost" size="icon" onClick={logout} className="shrink-0 text-[#A99E8C] hover:bg-[#FF4D1C]/10 hover:text-[#FF8B6A]" aria-label="Sign out"><LogOut className="h-4 w-4" /></Button></div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-7 lg:px-10 lg:py-8"><div className="mb-6 flex items-center gap-2 text-xs text-[#847966]"><span className="font-label text-[#C9A84C]">Royal Edit</span><ChevronRight className="h-3.5 w-3.5" /><span>{active}</span></div>{children}</main>
    </div>
  );
}
