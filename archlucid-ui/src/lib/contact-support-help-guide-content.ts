import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  ARCHLUCID_SUPPORT_EMAIL,
  SUPPORT_REPORT_PROBLEM_HELP_HREF,
} from "@/lib/support-workspace-present";

export const CONTACT_SUPPORT_HELP_SUBTITLE =
  "Report a problem on error pages, email support, or download a redacted diagnostics bundle.";

export const CONTACT_SUPPORT_HELP_PATH = inAppHelpHref("contact-support");

export const CONTACT_SUPPORT_PRIMARY_ACTIONS = {
  reportProblem: {
    label: "Report a problem",
    href: SUPPORT_REPORT_PROBLEM_HELP_HREF,
  },
  emailSupport: {
    label: "Email support",
    href: `mailto:${ARCHLUCID_SUPPORT_EMAIL}`,
  },
  troubleshooting: {
    label: "Troubleshooting guide",
    href: inAppHelpHref("troubleshooting"),
  },
} as const;
