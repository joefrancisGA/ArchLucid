import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ARCHITECTURE_SHARING_HELP_CANONICAL_PATH = "/help/architecture-sharing" as const;

export const ARCHITECTURE_SHARING_HELP_TOPIC_LABEL = "Architecture sharing inside your tenant" as const;

export const ARCHITECTURE_SHARING_HELP_CLAIM_DISCIPLINE =
  "This topic explains optional restrict-to-shares inside one tenant — it is not a second tenant, not live presence, and not finding-comment chat.";

export const ARCHITECTURE_SHARING_HELP_CLAIM_HEADING_ID = "architecture-sharing-boundary" as const;

export const ARCHITECTURE_SHARING_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Data handling and tenant isolation", href: inAppHelpHref("data-handling") },
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
] as const;
