"use client";
import { BUSINESS_ID } from "@/lib/constants";
import { useRooms } from "@/hooks/useRooms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DoorOpen, Users, AlertTriangle } from "lucide-react";

export default function SalasPage() {
  const { rooms, isLoading, error } = useRooms(BUSINESS_ID);

  const safeRooms = Array.isArray(rooms) ? rooms : [];

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 bg-white">
        <DoorOpen className="w-5 h-5 text-slate-400" />
        <h1 className="text-lg font-semibold text-slate-900">Salas</h1>
        {!isLoading && !error && (
          <span className="text-sm text-slate-400">({safeRooms.length} salas)</span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">

        {error && !isLoading && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 max-w-md">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Error al cargar las salas</p>
              <p className="mt-0.5 font-mono text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {(isLoading || !safeRooms) &&
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="border-slate-200">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}

          {!isLoading && !error &&
            safeRooms.map((r) => (
              <Card key={r.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-slate-900">{r.name}</p>
                    <Badge
                      variant="secondary"
                      className={r.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}
                    >
                      {r.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-sm text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>Capacidad: {r.capacity}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

          {!isLoading && !error && safeRooms.length === 0 && (
            <div className="col-span-3 py-12 text-center text-slate-400 text-sm">
              No hay salas registradas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
