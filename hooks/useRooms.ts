"use client";
import { useEffect, useState } from "react";
import type { RoomRow } from "@/types/database";

export function useRooms(businessId: string) {
  const [rooms, setRooms]       = useState<RoomRow[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    setRooms([]);
    setError(null);
    setLoading(true);

    if (!businessId) {
      console.warn("[useRooms] businessId vacío — verifica NEXT_PUBLIC_BUSINESS_ID en .env.local");
      setLoading(false);
      return;
    }

    let mounted = true;
    const controller = new AbortController();
    const url = `/api/rooms?business_id=${businessId}`;
    console.log("[useRooms] Iniciando carga:", url);

    const timeout = setTimeout(() => {
      controller.abort();
      console.error("[useRooms] ⏱ Timeout tras 5s");
    }, 5000);

    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        const json = await r.json();
        console.log("[useRooms] Respuesta:", { status: r.status, rooms: json.rooms?.length, error: json.error });
        if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
        if (mounted) { setRooms(json.rooms ?? []); setError(null); }
      })
      .catch((e: Error) => {
        if (!mounted) return;
        if (e.name === "AbortError") {
          setError("Timeout: sin respuesta del servidor tras 5s");
        } else {
          setError(e.message);
        }
        console.error("[useRooms] Error:", e.message);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (mounted) {
          setLoading(false);
          console.log("[useRooms] isLoading → false");
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [businessId]);

  return { rooms, isLoading, error };
}
