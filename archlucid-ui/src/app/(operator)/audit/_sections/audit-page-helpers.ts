import {
  auditBuyerEventIsSystemRecordedActor,
} from "@/app/(operator)/audit/audit-ui-helpers";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export const AUDIT_PAGE_SIZE = 200;

export function formatUtc(iso: string): string {
  try {
    const d = new Date(iso);

    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
  } catch {
    return iso;
  }
}

export function toDatetimeLocalInputValue(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function auditRunIdInputDisplayValue(buyerPolishedShell: boolean, runIdState: string): string {
  if (!buyerPolishedShell) {
    return runIdState;
  }

  const t = runIdState.trim();

  if (t.length === 0) {
    return "";
  }

  return buyerFacingReviewLinkLabelFromRunId(runIdState);
}

export function auditRunIdParseInputValue(buyerPolishedShell: boolean, raw: string): string {
  if (!buyerPolishedShell) {
    return raw;
  }

  const t = raw.trim();

  if (t.length === 0) {
    return "";
  }

  const showcaseFriendly = buyerFacingReviewLinkLabelFromRunId(SHOWCASE_STATIC_DEMO_RUN_ID);

  if (t === showcaseFriendly) {
    return SHOWCASE_STATIC_DEMO_RUN_ID;
  }

  const canon = canonicalizeDemoRunId(t);

  if (canon === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return SHOWCASE_STATIC_DEMO_RUN_ID;
  }

  return t;
}

export function tryFormatDataJson(dataJson: string): string {
  try {
    const parsed: unknown = JSON.parse(dataJson);

    return JSON.stringify(parsed, null, 2);
  } catch {
    return dataJson;
  }
}

export function auditBuyerActorRoleLine(actorName: string, eventType: string): string {
  const name = actorName.trim();

  if (auditBuyerEventIsSystemRecordedActor(name)) {
    return "System-recorded";
  }

  if (name === "Jordan Lee") {
    return "Reviewer";
  }

  if (name === "Taylor Morgan") {
    return "Approver";
  }

  if (eventType.trim().toLowerCase() === "finalize.run") {
    return "Approver";
  }

  return "Participant";
}

export interface AuditFilterFields {
  eventType: string;
  fromUtc: string;
  toUtc: string;
  correlationId: string;
  actorUserId: string;
  runId: string;
}
