import { DPA_TEMPLATE_HELP_PAGE_TITLE } from "@/lib/dpa-template-help-guide-content";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TRUST_CENTER_CANONICAL_PATH } from "@/lib/trust-center-evidence-copy";

export const SUBPROCESSORS_HELP_PAGE_EYEBROW = "Help topic" as const;

export const SUBPROCESSORS_HELP_BREADCRUMB_TOPIC_TITLE = "Subprocessors";

export const SUBPROCESSORS_HELP_PAGE_TITLE = "Subprocessors";

export const SUBPROCESSORS_HELP_TOPIC_LABEL = "How the subprocessors register works" as const;

export const SUBPROCESSORS_HELP_PAGE_SUBTITLE =
  "Hosted-service subprocessor register with 30-day change notice — use with Trust Center and the DPA template.";

export const SUBPROCESSORS_HELP_PAGE_SUBTITLE_BUYER =
  "Hosted-service subprocessor register with 30-day change notice for procurement and security diligence." as const;

export const SUBPROCESSORS_HELP_PRIMARY_CONTENT_ID = "help-subprocessors-primary-content" as const;

export const SUBPROCESSORS_HELP_SKIP_LINK_LABEL = "Skip to subprocessors guide" as const;

export function subprocessorsHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? SUBPROCESSORS_HELP_PAGE_SUBTITLE_BUYER : SUBPROCESSORS_HELP_PAGE_SUBTITLE;
}

export const SUBPROCESSORS_HELP_OVERVIEW =
  "Use this page when diligence needs the live subprocessor table for hosted ArchLucid. Open Trust Center for the diligence pack index, or the DPA template when counsel needs contractual schedules.";

export const SUBPROCESSORS_HELP_PRIMARY_ACTIONS = {
  openTrustCenter: {
    label: "Open Trust Center",
    href: TRUST_CENTER_CANONICAL_PATH,
    testId: "help-subprocessors-open-trust-center",
  },
  openDpaTemplate: {
    label: DPA_TEMPLATE_HELP_PAGE_TITLE,
    href: inAppHelpHref("dpa-template"),
    testId: "help-subprocessors-open-dpa-template",
  },
  openSecurityTrust: {
    label: "Security and trust",
    href: inAppHelpHref("security-trust"),
    testId: "help-subprocessors-open-security-trust",
  },
} as const;

export const SUBPROCESSORS_HELP_PATH = "/help/subprocessors" as const;
