"use client";
import { useState } from "react";
import { BUSINESS_ID } from "@/lib/constants";
import { useAppointments } from "@/hooks/useAppointments";
import { useStaff } from "@/hooks/useStaff";
import { useRooms } from "@/hooks/useRooms";
import { TopBar } from "@/components/layout/TopBar";
import { CalendarGrid } from "@/components/dashboard/CalendarGrid";
import { AppointmentFormDialog } from "@/components/appointments/AppointmentFormDialog";
import { AppointmentDetailDialog } from "@/components/appointments/AppointmentDetailDialog";
import type { AppointmentWithRelations } from "@/types/appointments";

export default function CalendarioPage() {
  const [date, setDate]             = useState(new Date());
  const [dialogOpen, setDialog]     = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithRelations | null>(null);

  const { appointments, isLoading: apptLoading, refetch } = useAppointments(BUSINESS_ID, date);
  const { staff, isLoading: staffLoading } = useStaff(BUSINESS_ID);
  const { rooms } = useRooms(BUSINESS_ID);

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        title="Calendario Global"
        date={date}
        onDateChange={setDate}
        onNewAppointment={() => setDialog(true)}
      />
      <div className="flex-1 overflow-auto p-6">
        <CalendarGrid
          appointments={appointments}
          staff={staff}
          isLoading={apptLoading || staffLoading}
          onCellClick={(staffId, startISO) => {
            setDialog(true);
          }}
          onAppointmentClick={(appt) => { setSelectedAppt(appt); setDetailOpen(true); }}
        />
      </div>

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialog}
        staff={staff}
        rooms={rooms}
        onSuccess={refetch}
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
