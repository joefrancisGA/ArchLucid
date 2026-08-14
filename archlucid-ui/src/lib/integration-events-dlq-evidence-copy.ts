import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const INTEGRATION_EVENTS_DLQ_CANONICAL_PATH = "/internal/failed-integration-messages" as const;

export const INTEGRATION_EVENTS_DLQ_HELP_TOPIC_LABEL = "How integration dead letters work" as const;

export const INTEGRATION_EVENTS_DLQ_CLAIM_DISCIPLINE =
  "This dead-letter queue is an Internal Operations triage surface for failed outbound integration events — it is not a sealed-review diligence Sources package. Rows can span every tenant; fix the root cause before bulk retry, and open Integration readiness or System health for connector posture.";

export const INTEGRATION_EVENTS_DLQ_SOURCES_INTRO =
  "Use these follow-ups when a dead-letter needs readiness checks, channel config, or operational health context.";


/** Operator Sources — no self-href to the DLQ page. */
export const INTEGRATION_EVENTS_DLQ_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "System health", href: "/administration/system-health" },
  { label: "Webhooks", href: "/integrations/webhooks" },
  { label: "Jira", href: "/integrations/jira" },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
] as const;
