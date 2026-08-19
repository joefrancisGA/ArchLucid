import {
  CONTACT_SUPPORT_HELP_PATH,
  CONTACT_SUPPORT_PRIMARY_ACTIONS,
} from "@/lib/contact-support-help-guide-content";
import { REPORT_PROBLEM_ACTION_LABEL } from "@/lib/report-problem-copy";
import {
  ARCHLUCID_SUPPORT_EMAIL,
  SUPPORT_REPORT_PROBLEM_HELP_HREF,
} from "@/lib/support-workspace-present";

/** Top-bar account menu and shell chrome — visible to every signed-in operator. */
export const OPERATOR_SHELL_GET_SUPPORT_MENU_ITEM = {
  id: "get-support",
  title: "Get support",
  description: "Contact support, report a problem, or download diagnostics.",
  href: CONTACT_SUPPORT_HELP_PATH,
} as const;

export const OPERATOR_SHELL_SUPPORT_QUICK_LINKS = {
  contactSupportPage: {
    label: "Contact support",
    href: CONTACT_SUPPORT_HELP_PATH,
  },
  reportProblem: {
    label: REPORT_PROBLEM_ACTION_LABEL,
    href: SUPPORT_REPORT_PROBLEM_HELP_HREF,
  },
  emailSupport: {
    label: CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.label,
    href: `mailto:${ARCHLUCID_SUPPORT_EMAIL}`,
  },
  troubleshooting: {
    label: "Troubleshooting",
    href: CONTACT_SUPPORT_PRIMARY_ACTIONS.troubleshooting.href,
  },
} as const;
