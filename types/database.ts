// ─── Raw database row types (mirrors Supabase schema 1-to-1) ───────────────

export type BusinessRow = {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
};

export type StaffRow = {
  id: string;
  business_id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type RoomRow = {
  id: string;
  business_id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
};

export type AppointmentRow = {
  id: string;
  business_id: string;
  staff_id: string | null;
  room_id: string | null;
  title: string;
  description: string | null;
  start_time: string; // ISO 8601 UTC
  end_time: string;   // ISO 8601 UTC
  status: AppointmentStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

// ─── Database schema type (used with Supabase generic client) ───────────────

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: BusinessRow;
        Insert: Omit<BusinessRow, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<BusinessRow, "id" | "created_at">>;
      };
      staff: {
        Row: StaffRow;
        Insert: Omit<StaffRow, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<StaffRow, "id" | "created_at">>;
      };
      rooms: {
        Row: RoomRow;
        Insert: Omit<RoomRow, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<RoomRow, "id" | "created_at">>;
      };
      appointments: {
        Row: AppointmentRow;
        Insert: Omit<AppointmentRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<AppointmentRow, "id" | "created_at">>;
      };
    };
  };
};
