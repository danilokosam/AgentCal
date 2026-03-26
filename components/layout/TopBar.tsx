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
    <div className="flex items-center justify-between px-3 sm:px-6 h-14 sm:h-16 border-b border-slate-200 bg-white sticky top-0 z-20 gap-2">
      {/* Left: title — hidden on very small screens to save space */}
      <h1 className="hidden sm:block text-lg font-semibold text-slate-900 shrink-0">{title}</h1>

      {/* Center: date navigator */}
      <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none justify-center sm:justify-start">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDateChange(subDays(date, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 min-w-0">
          <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
          {/* Short format on mobile, full on sm+ */}
          <span className="text-sm font-medium text-slate-700 capitalize truncate sm:hidden">
            {format(date, "d MMM", { locale: es })}
          </span>
          <span className="text-sm font-medium text-slate-700 capitalize hidden sm:inline">
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </span>
          {isToday && (
            <span className="ml-1 text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-medium shrink-0">
              Hoy
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDateChange(addDays(date, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Right: new appointment — icon only on mobile, full text on sm+ */}
      <Button
        onClick={onNewAppointment}
        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-4 sm:gap-2"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Nueva Cita</span>
      </Button>
    </div>
  );
}
