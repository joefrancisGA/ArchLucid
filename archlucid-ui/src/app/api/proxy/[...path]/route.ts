import { NextRequest } from "next/server";

import { handleRateLimitedForward } from "@/lib/proxy/proxy-forward";

/** Allow long-running multipart evidence forwards (up to 100 MB) on hosted Node runtimes. */
export const maxDuration = 600;

/** Handles GET requests from browser components → forwards to C# API with server-side credentials. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRateLimitedForward(request, context, "GET");
}

/** Handles POST requests from browser components → forwards to C# API with server-side credentials. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRateLimitedForward(request, context, "POST");
}

/** Handles PUT requests (tenant settings, webhook references, etc.) from browser-safe same-origin callers. */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRateLimitedForward(request, context, "PUT");
}

/** Handles PATCH requests (draft intake, run pin, alert archive, etc.) from browser-safe same-origin callers. */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRateLimitedForward(request, context, "PATCH");
}

/** Handles DELETE requests (resource teardown) from browser-safe same-origin callers. */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRateLimitedForward(request, context, "DELETE");
}
