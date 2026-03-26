"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Users, DoorOpen, Settings } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/dashboard",     icon: LayoutDashboard },
  { label: "Calendario", href: "/calendario",    icon: CalendarDays },
  { label: "Equipo",     href: "/equipo",        icon: Users },
  { label: "Salas",      href: "/salas",         icon: DoorOpen },
  { label: "Config",     href: "/configuracion", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden bg-white border-t border-slate-200 safe-area-inset-bottom">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
