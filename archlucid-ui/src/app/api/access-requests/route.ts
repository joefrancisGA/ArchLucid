import { NextRequest, NextResponse } from "next/server";

import {
  hasRecentAccessRequest,
  logAccessRequestAudit,
  logAcceptedAccessRequest,
  recordAcceptedAccessRequest,
} from "@/lib/server/access-request-audit-log";
import { sendAccessRequestNotification } from "@/lib/server/access-request-email";
import { isAccessRequestRateLimited } from "@/lib/server/access-request-rate-limit";
import { parseAccessRequestBody } from "@/lib/server/access-request-validation";

/** Handles `POST /api/access-requests` for private-beta access capture from auth callback failures. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseAccessRequestBody(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: "validation_failed", message: parsed.message }, { status: 400 });
  }

  const payload = parsed.value;

  if (payload.websiteUrl !== null) {
    logAccessRequestAudit({
      timestampUtc: new Date().toISOString(),
      workEmail: payload.workEmail,
      company: payload.company,
      status: "honeypot",
    });

    return new NextResponse(null, { status: 204 });
  }

  if (isAccessRequestRateLimited(request, payload.workEmail)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (hasRecentAccessRequest(payload.workEmail)) {
    logAccessRequestAudit({
      timestampUtc: new Date().toISOString(),
      workEmail: payload.workEmail,
      company: payload.company,
      status: "duplicate",
    });

    return NextResponse.json({ error: "duplicate_recent" }, { status: 409 });
  }

  try {
    await sendAccessRequestNotification(payload);
  } catch {
    logAccessRequestAudit({
      timestampUtc: new Date().toISOString(),
      workEmail: payload.workEmail,
      company: payload.company,
      status: "misconfigured",
    });

    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  recordAcceptedAccessRequest(payload.workEmail);
  logAcceptedAccessRequest(payload);

  return new NextResponse(null, { status: 204 });
}
