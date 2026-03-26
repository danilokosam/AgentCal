"use client";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  date: Date;
  onDateChange: (d: Date) => void;
  onNewAppointment: () => void;
  title: string;
};

export function TopBar({ date, onDateChange, onNewAppointment, title }: Props) {
  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200 bg-white sticky top-0 z-20">
      {/* Left: title */}
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>

      {/* Center: date navigator */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onDateChange(subDays(date, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700 capitalize">
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </span>
          {isToday && (
            <span className="ml-1 text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-medium">
              Hoy
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDateChange(addDays(date, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Right: new appointment */}
      <Button onClick={onNewAppointment} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
        <Plus className="w-4 h-4" />
        Nueva Cita
      </Button>
    </div>
  );
}
