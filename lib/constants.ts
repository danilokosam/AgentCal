export const BUSINESS_ID = process.env.NEXT_PUBLIC_BUSINESS_ID ?? "";

export const HOURS_START  = 8;   // 08:00 UTC
export const HOURS_END    = 18;  // 18:00 UTC
export const SLOT_MINUTES = 30;
export const TOTAL_SLOTS  = ((HOURS_END - HOURS_START) * 60) / SLOT_MINUTES; // 20 rows
