"use client";
import { useCallback, useEffect, useState } from "react";
import type { AppointmentWithRelations } from "@/types/appointments";
import { format } from "date-fns";

export function useAppointments(businessId: string, date: Date) {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [isLoading, setLoading]         = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const dateStr = format(date, "yyyy-MM-dd");

  const fetch_ = useCallback(() => {
    setAppointments([]);
    setError(null);
    setLoading(true);

    if (!businessId) {
      console.warn("[useAppointments] businessId vacío");
      setLoading(false);
      return () => {};
    }

    let mounted = true;
    const controller = new AbortController();
    const url = `/api/appointments?business_id=${businessId}&date=${dateStr}`;
    console.log("[useAppointments] Iniciando carga:", url);

    const timeout = setTimeout(() => {
      controller.abort();
      console.error("[useAppointments] ⏱ Timeout tras 5s");
    }, 5000);

    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        const json = await r.json();
        console.log("[useAppointments] Respuesta:", { status: r.status, appointments: json.appointments?.length, error: json.error });
        if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
        if (mounted) { setAppointments(json.appointments ?? []); setError(null); }
      })
      .catch((e: Error) => {
        if (!mounted) return;
        if (e.name === "AbortError") {
          setError("Timeout: sin respuesta del servidor tras 5s");
        } else {
          setError(e.message);
        }
        console.error("[useAppointments] Error:", e.message);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (mounted) {
          setLoading(false);
          console.log("[useAppointments] isLoading → false");
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [businessId, dateStr]);

  useEffect(() => {
    const cleanup = fetch_();
    return cleanup;
  }, [fetch_]);

  return { appointments, isLoading, error, refetch: fetch_ };
}
