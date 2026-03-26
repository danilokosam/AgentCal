/**
 * MCP Tool definitions for AgentCal.
 *
 * Each tool maps directly to a service function and follows the
 * Model Context Protocol JSON Schema spec for parameters.
 *
 * Consumed by mcp/server.ts to register tools with the MCP server.
 */

export const AGENTCAL_TOOLS = [
  {
    name: "get_availability",
    description:
      "Returns available appointment slots for a specific date, optionally filtered by staff member and/or room. All times are UTC.",
    inputSchema: {
      type: "object",
      required: ["business_id", "date", "duration_minutes"],
      properties: {
        business_id: { type: "string", description: "UUID of the business" },
        date: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          description: "Date to check in YYYY-MM-DD format (interpreted as UTC)",
        },
        duration_minutes: {
          type: "number",
          minimum: 15,
          maximum: 480,
          description: "Required appointment duration in minutes",
        },
        staff_id: { type: "string", description: "UUID of the staff member (optional)" },
        room_id: { type: "string", description: "UUID of the room (optional)" },
      },
    },
  },
  {
    name: "book_appointment",
    description:
      "Books an appointment after checking for conflicts. Returns the created appointment or an error if there is a scheduling conflict.",
    inputSchema: {
      type: "object",
      required: ["business_id", "title", "start_time", "end_time"],
      properties: {
        business_id: { type: "string", description: "UUID of the business" },
        staff_id: { type: "string", description: "UUID of the staff member (optional)" },
        room_id: { type: "string", description: "UUID of the room (optional)" },
        title: { type: "string", description: "Title / reason for the appointment" },
        description: { type: "string", description: "Optional details" },
        start_time: {
          type: "string",
          description: "Start time as ISO 8601 UTC string (e.g. 2025-06-01T09:00:00Z)",
        },
        end_time: {
          type: "string",
          description: "End time as ISO 8601 UTC string (e.g. 2025-06-01T09:30:00Z)",
        },
        metadata: {
          type: "object",
          description: "Arbitrary key-value pairs (client info, notes, etc.)",
          additionalProperties: true,
        },
      },
    },
  },
  {
    name: "list_appointments",
    description: "Lists appointments for a business, with optional filters.",
    inputSchema: {
      type: "object",
      required: ["business_id"],
      properties: {
        business_id: { type: "string" },
        date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        staff_id: { type: "string" },
        room_id: { type: "string" },
        status: {
          type: "string",
          enum: ["pending", "confirmed", "cancelled", "completed"],
        },
      },
    },
  },
  {
    name: "cancel_appointment",
    description: "Cancels an existing appointment by ID.",
    inputSchema: {
      type: "object",
      required: ["appointment_id", "business_id"],
      properties: {
        appointment_id: { type: "string", description: "UUID of the appointment to cancel" },
        business_id: { type: "string", description: "UUID of the business (for authorization)" },
      },
    },
  },
  {
    name: "list_staff",
    description: "Returns all active staff members for a business.",
    inputSchema: {
      type: "object",
      required: ["business_id"],
      properties: {
        business_id: { type: "string" },
      },
    },
  },
  {
    name: "list_rooms",
    description: "Returns all active rooms for a business.",
    inputSchema: {
      type: "object",
      required: ["business_id"],
      properties: {
        business_id: { type: "string" },
      },
    },
  },
] as const;

export type ToolName = (typeof AGENTCAL_TOOLS)[number]["name"];
