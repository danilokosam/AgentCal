"use client";
import type { AppointmentWithRelations } from "@/types/appointments";
import { formatTime } from "@/lib/calendarUtils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  appointment: AppointmentWithRelations;
  onClick?: () => void;
};

export function AppointmentBlock({ appointment, onClick }: Props) {
  const timeRange = `${formatTime(appointment.start_time)} – ${formatTime(appointment.end_time)}`;

  return (
    <Tooltip>
      <TooltipTrigger
        className="absolute inset-x-0.5 rounded-md bg-blue-600 text-white px-2 py-1 cursor-pointer hover:bg-blue-700 active:bg-blue-800 transition-colors overflow-hidden shadow-sm text-left"
        render={<div />}
        onClick={onClick}
      >
        <p className="text-xs font-medium truncate leading-tight">{appointment.title}</p>
        <p className="text-[10px] text-blue-200 mt-0.5">{timeRange}</p>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{appointment.title}</p>
          <p className="text-slate-300">{timeRange}</p>
          {appointment.description && <p className="text-slate-400">{appointment.description}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
