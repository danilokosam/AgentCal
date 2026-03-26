"use client";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, Clock, Activity } from "lucide-react";
import type { AppointmentWithRelations } from "@/types/appointments";
import type { StaffRow } from "@/types/database";
import { TOTAL_SLOTS } from "@/lib/constants";

type Props = {
  appointments: AppointmentWithRelations[];
  staff: StaffRow[];
  isLoading: boolean;
};

export function KpiCards({ appointments, staff, isLoading }: Props) {
  const kpis = useMemo(() => {
    const confirmed   = appointments.filter((a) => a.status === "confirmed").length;
    const pending     = appointments.filter((a) => a.status === "pending").length;
    const maxSlots    = staff.length * TOTAL_SLOTS;
    const ocupacion   = maxSlots > 0 ? Math.round((confirmed / maxSlots) * 100) : 0;
    return { confirmed, pending, ocupacion };
  }, [appointments, staff]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-slate-200">
            <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-9 w-20 mt-1" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Capacidad */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Capacidad Hoy</CardTitle>
          <CalendarCheck className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{kpis.ocupacion}%</div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(kpis.ocupacion, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{kpis.confirmed} citas confirmadas</p>
        </CardContent>
      </Card>

      {/* Pendientes */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Citas Hoy</CardTitle>
          <Clock className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{kpis.confirmed + kpis.pending}</div>
          <p className="text-xs text-slate-400 mt-1.5">
            {kpis.pending > 0 ? `${kpis.pending} pendiente${kpis.pending > 1 ? "s" : ""}` : "Todas confirmadas"}
          </p>
        </CardContent>
      </Card>

      {/* MCP Status */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Estado del Sistema</CardTitle>
          <Activity className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Badge className="w-fit bg-green-100 text-green-800 hover:bg-green-100 border-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
            MCP Active
          </Badge>
          <p className="text-xs text-slate-400">Protocolo 2024-11-05</p>
        </CardContent>
      </Card>
    </div>
  );
}
