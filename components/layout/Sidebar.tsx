"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  DoorOpen,
  Settings,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",         href: "/dashboard",      icon: LayoutDashboard },
  { label: "Calendario Global", href: "/calendario",     icon: CalendarDays },
  { label: "Equipo",            href: "/equipo",         icon: Users },
  { label: "Salas",             href: "/salas",          icon: DoorOpen },
  { label: "Configuración",     href: "/configuracion",  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-slate-50 border-r border-slate-200 flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-slate-200">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-lg tracking-tight">AgentCal</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200">
        <p className="text-xs text-slate-400">AgentCal MVP · v0.1.0</p>
      </div>
    </aside>
  );
}
