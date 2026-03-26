"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, Save } from "lucide-react";
import { BUSINESS_ID } from "@/lib/constants";
import { generateTimeOptions, formatTime } from "@/lib/calendarUtils";
import type { AppointmentWithRelations } from "@/types/appointments";
import type { StaffRow, RoomRow } from "@/types/database";

type Props = {
  appointment: AppointmentWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffRow[];
  rooms: RoomRow[];
  onSuccess: () => void;
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
  completed: "Completada",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-slate-100 text-slate-500",
  completed: "bg-blue-100 text-blue-800",
};

const DURATIONS = [
  { label: "30 minutos", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "1 hora 30 min", value: 90 },
  { label: "2 horas", value: 120 },
];

function NativeSelect({
  value,
  onChange,
  children,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </select>
  );
}

export function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange,
  staff,
  rooms,
  onSuccess,
}: Props) {
  const [patientName, setPatientName] = useState("");
  const [reason, setReason] = useState("");
  const [staffId, setStaffId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMin, setDurationMin] = useState("60");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Populate form when appointment changes
  useEffect(() => {
    if (!appointment) return;
    setPatientName(appointment.title);
    setReason(appointment.description ?? "");
    setStaffId(appointment.staff_id ?? "");
    setRoomId(appointment.room_id ?? "");

    // Extract HH:MM from ISO for the time select
    const d = new Date(appointment.start_time);
    const h = String(d.getUTCHours()).padStart(2, "0");
    const m = String(d.getUTCMinutes()).padStart(2, "0");
    setStartTime(`${h}:${m}`);

    const diffMin =
      (new Date(appointment.end_time).getTime() -
        new Date(appointment.start_time).getTime()) /
      60000;
    const closest = DURATIONS.reduce((prev, cur) =>
      Math.abs(cur.value - diffMin) < Math.abs(prev.value - diffMin) ? cur : prev
    );
    setDurationMin(String(closest.value));
  }, [appointment]);

  if (!appointment) return null;

  const dateLabel = format(new Date(appointment.start_time), "EEEE d 'de' MMMM yyyy");
  const timeOptions = generateTimeOptions();

  async function handleSave() {
    if (!patientName.trim()) {
      toast.error("El nombre del paciente no puede estar vacío");
      return;
    }
    if (!staffId && !roomId) {
      toast.error("Selecciona al menos un doctor o una sala");
      return;
    }

    setIsSaving(true);
    try {
      // Build start ISO from selected date + selected time
      const baseDateStr = format(new Date(appointment.start_time), "yyyy-MM-dd");
      const [h, m] = startTime.split(":").map(Number);
      const startMs = Date.UTC(
        Number(baseDateStr.slice(0, 4)),
        Number(baseDateStr.slice(5, 7)) - 1,
        Number(baseDateStr.slice(8, 10)),
        h,
        m
      );
      const endMs = startMs + Number(durationMin) * 60_000;
      const startISO = new Date(startMs).toISOString();
      const endISO = new Date(endMs).toISOString();

      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: BUSINESS_ID,
          title: patientName.trim(),
          description: reason.trim() || null,
          staff_id: staffId || null,
          room_id: roomId || null,
          start_time: startISO,
          end_time: endISO,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          toast.error(`Conflicto detectado: ${data.error}`);
        } else {
          toast.error(`Error al procesar la solicitud: ${data.error}`);
        }
        return;
      }

      toast.success("Cita actualizada con éxito");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Error al procesar la solicitud");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancel() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: BUSINESS_ID }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(`Error al procesar la solicitud: ${data.error}`);
        return;
      }

      toast.success("Cita eliminada correctamente", {
        className: "bg-slate-800 text-white",
      });
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Error al procesar la solicitud");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-slate-900 text-base">Detalle de Cita</DialogTitle>
            <Badge
              variant="secondary"
              className={STATUS_COLORS[appointment.status] ?? "bg-slate-100 text-slate-500"}
            >
              {STATUS_LABELS[appointment.status] ?? appointment.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 capitalize">{dateLabel}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Read-only info row */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Hora actual</span>
              <span className="font-medium text-slate-800">
                {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
              </span>
            </div>
            {appointment.staff && (
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor</span>
                <span className="font-medium text-slate-800">{appointment.staff.name}</span>
              </div>
            )}
            {appointment.room && (
              <div className="flex justify-between">
                <span className="text-slate-500">Sala</span>
                <span className="font-medium text-slate-800">{appointment.room.name}</span>
              </div>
            )}
          </div>

          {/* Editable fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="detail-patient">Nombre del Paciente</Label>
              <Input
                id="detail-patient"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ej: Juan García"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="detail-reason">
                Motivo de la Consulta{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </Label>
              <Input
                id="detail-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Revisión anual, dolor de cabeza…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="detail-staff">Doctor</Label>
                <NativeSelect id="detail-staff" value={staffId} onChange={setStaffId}>
                  <option value="">Sin asignar</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-room">Sala</Label>
                <NativeSelect id="detail-room" value={roomId} onChange={setRoomId}>
                  <option value="">Sin sala</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="detail-start">Hora inicio</Label>
                <NativeSelect id="detail-start" value={startTime} onChange={setStartTime}>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-duration">Duración</Label>
                <NativeSelect id="detail-duration" value={durationMin} onChange={setDurationMin}>
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={String(d.value)}>{d.label}</option>
                  ))}
                </NativeSelect>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isDeleting || isSaving}
            className="w-full sm:w-auto sm:mr-auto gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Eliminando…" : "Cancelar cita"}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            className="w-full sm:w-auto gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
