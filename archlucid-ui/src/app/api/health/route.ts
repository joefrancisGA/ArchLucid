import { NextResponse } from "next/server";

import {
  buildUiProcessHealthBody,
  type UiProcessHealthBody,
} from "@/lib/ui-process-health";

/**
 * Lightweight UI process health for Container Apps probes and CD.
 * Does not call the API — that path is `/api/proxy/health/*`.
 * Not a customer-facing surface; commitSha is build identity only.
 */
export type UiHealthResponse = UiProcessHealthBody;

export async function GET(): Promise<NextResponse<UiHealthResponse>> {
  return NextResponse.json(buildUiProcessHealthBody(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
