"use client";
import { BUSINESS_ID } from "@/lib/constants";
import { useStaff } from "@/hooks/useStaff";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertTriangle } from "lucide-react";

export default function EquipoPage() {
  const { staff, isLoading, error } = useStaff(BUSINESS_ID);

  // Normalize: always an array, never undefined/null
  const safeStaff = Array.isArray(staff) ? staff : [];

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 bg-white">
        <Users className="w-5 h-5 text-slate-400" />
        <h1 className="text-lg font-semibold text-slate-900">Equipo</h1>
        {!isLoading && !error && (
          <span className="text-sm text-slate-400">({safeStaff.length} miembros)</span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 max-w-md">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Error al cargar el equipo</p>
              <p className="mt-0.5 font-mono text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {/* Skeleton while loading */}
          {(isLoading || !safeStaff) &&
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="border-slate-200">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </CardContent>
              </Card>
            ))}

          {/* Data cards — only when not loading and no error */}
          {!isLoading && !error &&
            safeStaff.map((s) => (
              <Card key={s.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{s.email}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={s.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}
                    >
                      {s.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 capitalize">{s.role}</p>
                </CardContent>
              </Card>
            ))}

          {/* Empty state */}
          {!isLoading && !error && safeStaff.length === 0 && (
            <div className="col-span-3 py-12 text-center text-slate-400 text-sm">
              No hay miembros del equipo registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
