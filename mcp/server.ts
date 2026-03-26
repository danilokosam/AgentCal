#!/usr/bin/env node
/**
 * AgentCal MCP Server
 *
 * Implements the Model Context Protocol over stdio so that Claude Code
 * (or any MCP-compatible agent) can call our scheduling tools directly.
 *
 * Usage:
 *   npx ts-node --esm mcp/server.ts
 *   (or via npx tsx mcp/server.ts)
 *
 * Add to ~/.config/claude/mcp.json:
 * {
 *   "mcpServers": {
 *     "agent-cal": {
 *       "command": "npx",
 *       "args": ["tsx", "mcp/server.ts"],
 *       "cwd": "<absolute path to this project>"
 *     }
 *   }
 * }
 */

import { createInterface } from "readline";
import { AGENTCAL_TOOLS, type ToolName } from "./tools.js";
import {
  getAvailability,
  bookAppointment,
  listAppointments,
  cancelAppointment,
} from "../services/appointmentService.js";
import { createAdminClient } from "../lib/supabase.js";

// ─── MCP Message types (minimal subset) ─────────────────────────────────────

type MCPRequest = {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
};

type MCPResponse = {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string };
};

// ─── Tool dispatcher ─────────────────────────────────────────────────────────

async function dispatchTool(name: ToolName, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "get_availability":
      return getAvailability(args as Parameters<typeof getAvailability>[0]);

    case "book_appointment":
      return bookAppointment(args as Parameters<typeof bookAppointment>[0]);

    case "list_appointments": {
      const { business_id, ...filters } = args as { business_id: string } & Record<string, string>;
      return listAppointments(business_id, filters);
    }

    case "cancel_appointment": {
      const { appointment_id, business_id } = args as {
        appointment_id: string;
        business_id: string;
      };
      return cancelAppointment(appointment_id, business_id);
    }

    case "list_staff": {
      const db = createAdminClient();
      const { data, error } = await db
        .from("staff")
        .select("*")
        .eq("business_id", args.business_id as string)
        .eq("is_active", true)
        .order("name");
      if (error) throw new Error(error.message);
      return { staff: data };
    }

    case "list_rooms": {
      const db = createAdminClient();
      const { data, error } = await db
        .from("rooms")
        .select("*")
        .eq("business_id", args.business_id as string)
        .eq("is_active", true)
        .order("name");
      if (error) throw new Error(error.message);
      return { rooms: data };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── MCP stdio loop ──────────────────────────────────────────────────────────

function send(response: MCPResponse) {
  process.stdout.write(JSON.stringify(response) + "\n");
}

async function handleRequest(req: MCPRequest): Promise<MCPResponse> {
  const { id, method, params } = req;

  try {
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "agent-cal", version: "0.1.0" },
        },
      };
    }

    if (method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: AGENTCAL_TOOLS },
      };
    }

    if (method === "tools/call") {
      const toolName = (params as { name: string }).name as ToolName;
      const toolArgs = ((params as { arguments?: Record<string, unknown> }).arguments ?? {});
      const result = await dispatchTool(toolName, toolArgs);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        },
      };
    }

    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32000, message },
    };
  }
}

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const req = JSON.parse(trimmed) as MCPRequest;
    const response = await handleRequest(req);
    send(response);
  } catch {
    send({
      jsonrpc: "2.0",
      id: 0,
      error: { code: -32700, message: "Parse error" },
    });
  }
});

process.stderr.write("AgentCal MCP server started (stdio)\n");
