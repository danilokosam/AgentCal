"use client";
import { useEffect, useState } from "react";
import type { StaffRow } from "@/types/database";

export function useStaff(businessId: string) {
  const [staff, setStaff]       = useState<StaffRow[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    // Reset to clean slate on every run (route change or businessId change)
    setStaff([]);
    setError(null);
    setLoading(true);

    if (!businessId) {
      console.warn("[useStaff] businessId vacío — verifica NEXT_PUBLIC_BUSINESS_ID en .env.local");
      setLoading(false);
      return;
    }

    let mounted = true; // guard: prevents state updates after unmount
    const controller = new AbortController();
    const url = `/api/staff?business_id=${businessId}`;
    console.log("[useStaff] Iniciando carga:", url);

    const timeout = setTimeout(() => {
      controller.abort();
      console.error("[useStaff] ⏱ Timeout tras 5s");
    }, 5000);

    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        const json = await r.json();
        console.log("[useStaff] Respuesta:", { status: r.status, staff: json.staff?.length, error: json.error });
        if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
        if (mounted) { setStaff(json.staff ?? []); setError(null); }
      })
      .catch((e: Error) => {
        if (!mounted) return; // component unmounted — silently discard
        if (e.name === "AbortError") {
          setError("Timeout: sin respuesta del servidor tras 5s");
        } else {
          setError(e.message);
        }
        console.error("[useStaff] Error:", e.message);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (mounted) {
          setLoading(false);
          console.log("[useStaff] isLoading → false");
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [businessId]);

  return { staff, isLoading, error };
}
