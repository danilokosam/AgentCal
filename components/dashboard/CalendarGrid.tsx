"use client";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentBlock } from "./AppointmentBlock";
import { slotToRow, durationToRowSpan, rowToLabel, formatTime } from "@/lib/calendarUtils";
import type { AppointmentWithRelations } from "@/types/appointments";
import type { StaffRow } from "@/types/database";
import { TOTAL_SLOTS as SLOTS } from "@/lib/constants";

type Props = {
  appointments: AppointmentWithRelations[];
  staff: StaffRow[];
  isLoading: boolean;
  onCellClick?: (staffId: string, startISO: string) => void;
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void;
};

const ROW_HEIGHT_PX = 48; // px per 30-min slot
const TIME_COL_W   = 56;  // px for the time gutter

export function CalendarGrid({ appointments, staff, isLoading, onCellClick, onAppointmentClick }: Props) {
  // Group appointments by staff_id
  const byStaff = useMemo(() => {
    const map = new Map<string, AppointmentWithRelations[]>();
    for (const s of staff) map.set(s.id, []);
    for (const a of appointments) {
      if (a.staff_id && map.has(a.staff_id)) {
        map.get(a.staff_id)!.push(a);
      }
    }
    return map;
  }, [appointments, staff]);

  const rows = Array.from({ length: SLOTS }, (_, i) => i + 1); // 1..20

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        {/* Mobile skeleton */}
        <div className="md:hidden divide-y divide-slate-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-12 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <div className="flex bg-slate-50 border-b border-slate-200 p-3 gap-3">
            <Skeleton className="h-5 w-12 shrink-0" />
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-5 flex-1" />)}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 border-b border-slate-100">
              <Skeleton className="h-10 w-12 shrink-0" />
              {[1, 2, 3].map((j) => <Skeleton key={j} className="h-10 flex-1 rounded-md" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-auto bg-white">
      {/* ── Mobile: vertical appointment list ─────────────────────────────── */}
      <div className="md:hidden divide-y divide-slate-100">
        {appointments.length === 0 ? (
          <p className="py-12 text-center text-slate-400 text-sm">No hay citas para hoy.</p>
        ) : (
          appointments.map((appt) => {
            const member = staff.find((s) => s.id === appt.staff_id);
            return (
              <div
                key={appt.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
                onClick={() => onAppointmentClick?.(appt)}
              >
                <div className="w-14 shrink-0 text-xs text-slate-400 font-medium pt-0.5 tabular-nums">
                  {formatTime(appt.start_time)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{appt.title}</p>
                  {member && <p className="text-xs text-slate-500 mt-0.5 truncate">{member.name}</p>}
                </div>
                <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              </div>
            );
          })
        )}
      </div>

      {/* ── Desktop: full CSS grid ─────────────────────────────────────────── */}
      <div className="hidden md:block">
      {/* Header row — staff names */}
      <div
        className="flex bg-slate-50 border-b border-slate-200 sticky top-0 z-10"
        style={{ paddingLeft: TIME_COL_W }}
      >
        {staff.map((s) => (
          <div
            key={s.id}
            className="flex-1 min-w-[140px] px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide truncate border-l border-slate-200"
          >
            {s.name}
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="flex">
        {/* Time gutter */}
        <div className="shrink-0 border-r border-slate-200" style={{ width: TIME_COL_W }}>
          {rows.map((row) => {
            const label = rowToLabel(row);
            return (
              <div
                key={row}
                className="border-b border-slate-100 flex items-start justify-end pr-2 pt-1"
                style={{ height: ROW_HEIGHT_PX }}
              >
                {label && (
                  <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Staff columns */}
        {staff.map((s) => {
          const staffAppts = byStaff.get(s.id) ?? [];
          return (
            <div
              key={s.id}
              className="flex-1 min-w-[140px] relative border-l border-slate-200"
              style={{ height: ROW_HEIGHT_PX * SLOTS }}
            >
              {/* Empty slot cells (clickable) */}
              {rows.map((row) => (
                <div
                  key={row}
                  className="absolute w-full border-b border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  style={{ top: (row - 1) * ROW_HEIGHT_PX, height: ROW_HEIGHT_PX }}
                  onClick={() => onCellClick?.(s.id, isoFromRow(row))}
                />
              ))}

              {/* Appointment blocks */}
              {staffAppts.map((appt) => {
                const rowStart  = slotToRow(appt.start_time);
                const rowSpan   = durationToRowSpan(appt.start_time, appt.end_time);
                return (
                  <div
                    key={appt.id}
                    className="absolute w-full z-10 px-0.5"
                    style={{
                      top:    (rowStart - 1) * ROW_HEIGHT_PX + 2,
                      height: rowSpan * ROW_HEIGHT_PX - 4,
                    }}
                  >
                    <AppointmentBlock
                      appointment={appt}
                      onClick={() => onAppointmentClick?.(appt)}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      </div> {/* end desktop grid */}
    </div>
  );
}

// Convert a row number back to an ISO UTC string for cell click prefill
function isoFromRow(row: number): string {
  const { HOURS_START, SLOT_MINUTES } = { HOURS_START: 8, SLOT_MINUTES: 30 };
  const totalMinutes = (row - 1) * SLOT_MINUTES;
  const hour  = HOURS_START + Math.floor(totalMinutes / 60);
  const min   = totalMinutes % 60;
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hour, min)).toISOString();
}
