"use client";
import { useState } from "react";
import { format, addMinutes } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { BUSINESS_ID } from "@/lib/constants";
import { generateTimeOptions } from "@/lib/calendarUtils";
import type { StaffRow, RoomRow } from "@/types/database";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffRow[];
  rooms: RoomRow[];
  onSuccess: () => void;
  prefill?: { staffId?: string; startTime?: string } | null;
};

const TIME_OPTIONS = generateTimeOptions();
const DURATION_OPTIONS = [
  { label: "30 minutos", value: 30 },
  { label: "60 minutos", value: 60 },
  { label: "90 minutos", value: 90 },
  { label: "120 minutos", value: 120 },
];

// Native <select> styled to match the design system — avoids base-ui/dialog portal conflicts
function NativeSelect({
  value,
  onChange,
  children,
  className,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900",
        "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center]",
        className
      )}
    >
      {children}
    </select>
  );
}

export function AppointmentFormDialog({ open, onOpenChange, staff, rooms, onSuccess, prefill }: Props) {
  const [patientName, setPatientName] = useState("");
  const [reason, setReason]           = useState("");
  const [staffId, setStaffId]         = useState(prefill?.staffId ?? "");
  const [roomId, setRoomId]           = useState("");
  const [date, setDate]               = useState<Date>(new Date());
  const [startTime, setStart]         = useState("09:00");
  const [duration, setDuration]       = useState(30);
  const [submitting, setSub]          = useState(false);
  const [calOpen, setCalOpen]         = useState(false);

  const handleSubmit = async () => {
    if (!patientName.trim()) { toast.error("El nombre del paciente es obligatorio"); return; }
    if (!staffId && !roomId) { toast.error("Selecciona al menos un doctor o una sala"); return; }

    const [h, m] = startTime.split(":").map(Number);
    const baseDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m));
    const start_time = baseDate.toISOString();
    const end_time   = addMinutes(baseDate, duration).toISOString();

    setSub(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: BUSINESS_ID,
          staff_id: staffId || undefined,
          room_id: roomId || undefined,
          title: patientName.trim(),
          description: reason.trim() || undefined,
          start_time,
          end_time,
          metadata: { booked_via: "web_ui" },
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error(`Conflicto detectado: ${data.error}`);
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? "Error al crear la cita");
        return;
      }

      toast.success("Cita creada exitosamente");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSub(false);
    }
  };

  const resetForm = () => {
    setPatientName(""); setReason(""); setStaffId(""); setRoomId(""); setStart("09:00"); setDuration(30);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Nueva Cita</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nombre del paciente */}
          <div className="space-y-1.5">
            <Label htmlFor="patientName">Nombre del Paciente</Label>
            <Input
              id="patientName"
              placeholder="Ej: Juan García"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>

          {/* Motivo de la consulta */}
          <div className="space-y-1.5">
            <Label htmlFor="reason">
              Motivo de la Consulta{" "}
              <span className="text-slate-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="reason"
              placeholder="Ej: Revisión anual, dolor de cabeza…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Doctor */}
          <div className="space-y-1.5">
            <Label htmlFor="staffId">Doctor</Label>
            <NativeSelect id="staffId" value={staffId} onChange={setStaffId}>
              <option value="">Seleccionar doctor...</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </NativeSelect>
          </div>

          {/* Sala */}
          <div className="space-y-1.5">
            <Label htmlFor="roomId">Sala <span className="text-slate-400 font-normal">(opcional)</span></Label>
            <NativeSelect id="roomId" value={roomId} onChange={setRoomId}>
              <option value="">Seleccionar sala...</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </NativeSelect>
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger
                className={cn(
                  "flex h-9 w-full items-center justify-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 transition-colors hover:bg-slate-50",
                  !date && "text-slate-400"
                )}
              >
                <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
                {date ? format(date, "PPP") : "Seleccionar fecha"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { if (d) { setDate(d); setCalOpen(false); } }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hora + Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Hora de inicio</Label>
              <NativeSelect id="startTime" value={startTime} onChange={setStart}>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duración</Label>
              <NativeSelect id="duration" value={String(duration)} onChange={(v) => setDuration(Number(v))}>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={String(d.value)}>{d.label}</option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmar cita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
