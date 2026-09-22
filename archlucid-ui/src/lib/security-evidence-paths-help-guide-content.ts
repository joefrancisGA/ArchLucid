import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SECURITY_EVIDENCE_PATHS_HELP_PATH = "/help/security-evidence-paths" as const;

export const SECURITY_EVIDENCE_PATHS_HELP_PAGE_TITLE = "Security evidence paths" as const;

export const SECURITY_EVIDENCE_PATHS_HELP_BREADCRUMB_TOPIC_TITLE = SECURITY_EVIDENCE_PATHS_HELP_PAGE_TITLE;

export const SECURITY_EVIDENCE_PATHS_HELP_PAGE_SUBTITLE =
  "Read architect path summaries, confidence bands, weakest hops, and cut points in the remediation factory Path inspect panel." as const;

export const SECURITY_EVIDENCE_PATHS_HELP_PRIMARY_CONTENT_ID = "help-security-evidence-paths-content" as const;

export const SECURITY_EVIDENCE_PATHS_HELP_SKIP_LINK_LABEL = "Skip to security evidence paths guide" as const;

export const SECURITY_EVIDENCE_PATHS_HELP_CLAIM_DISCIPLINE =
  "Path inspect describes configuration paths and cited hops — not observed traffic, compliance attestation, or live apply actions." as const;

export const SECURITY_EVIDENCE_PATHS_HELP_PRIMARY_ACTION = {
  label: "Open remediation factory",
  href: "/governance/remediation-factory",
} as const;

export const SECURITY_EVIDENCE_PATHS_HELP_RELATED_ACTION = {
  label: "Inspect stored evidence",
  href: inAppHelpHref("inspect-stored-evidence"),
} as const;
