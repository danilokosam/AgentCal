"use client";
import { useState } from "react";
import { BUSINESS_ID } from "@/lib/constants";
import { useAppointments } from "@/hooks/useAppointments";
import { useStaff } from "@/hooks/useStaff";
import { useRooms } from "@/hooks/useRooms";
import { TopBar } from "@/components/layout/TopBar";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { CalendarGrid } from "@/components/dashboard/CalendarGrid";
import { AppointmentFormDialog } from "@/components/appointments/AppointmentFormDialog";
import { AppointmentDetailDialog } from "@/components/appointments/AppointmentDetailDialog";
import { AlertTriangle } from "lucide-react";
import type { AppointmentWithRelations } from "@/types/appointments";

type PrefillSlot = { staffId: string; startTime: string } | null;

export default function DashboardPage() {
  const [date, setDate]             = useState(new Date());
  const [dialogOpen, setDialog]     = useState(false);
  const [prefill, setPrefill]       = useState<PrefillSlot>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithRelations | null>(null);

  const { appointments, isLoading: apptLoading, error: apptError, refetch } = useAppointments(BUSINESS_ID, date);
  const { staff, isLoading: staffLoading, error: staffError }               = useStaff(BUSINESS_ID);
  const { rooms, error: roomsError }                                         = useRooms(BUSINESS_ID);

  const isLoading = apptLoading || staffLoading;
  const anyError  = staffError ?? apptError ?? roomsError;

  console.log("[Dashboard] Estado:", {
    BUSINESS_ID,
    isLoading,
    staffCount: staff.length,
    appointmentsCount: appointments.length,
    errors: { staffError, apptError, roomsError },
  });

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        title="Dashboard"
        date={date}
        onDateChange={setDate}
        onNewAppointment={() => { setPrefill(null); setDialog(true); }}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Error banner — visible en pantalla, no solo en consola */}
        {anyError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Error de carga</p>
              <p className="mt-0.5 text-red-700 font-mono text-xs">{anyError}</p>
              {!BUSINESS_ID && (
                <p className="mt-1 text-red-600">
                  ⚠️ <code>NEXT_PUBLIC_BUSINESS_ID</code> está vacío en <code>.env.local</code>
                </p>
              )}
            </div>
          </div>
        )}

        <KpiCards appointments={appointments} staff={staff} isLoading={isLoading} />

        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Agenda del día
          </h2>
          <CalendarGrid
            appointments={appointments}
            staff={staff}
            isLoading={isLoading}
            onCellClick={(staffId, startISO) => { setPrefill({ staffId, startTime: startISO }); setDialog(true); }}
            onAppointmentClick={(appt) => { setSelectedAppt(appt); setDetailOpen(true); }}
          />
        </div>
      </div>

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialog}
        staff={staff}
        rooms={rooms}
        onSuccess={refetch}
        prefill={prefill}
      />

      <AppointmentDetailDialog
        appointment={selectedAppt}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        staff={staff}
        rooms={rooms}
        onSuccess={refetch}
      />
    </div>
  );
}
