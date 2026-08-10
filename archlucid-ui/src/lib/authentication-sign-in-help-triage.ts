import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AUTHENTICATION_SIGN_IN_COMMON_ISSUES_ANCHOR = "common-sign-in-issues" as const;
export const AUTHENTICATION_SIGN_IN_ACCOUNT_RECOVERY_ANCHOR = "account-recovery" as const;

export const AUTHENTICATION_SIGN_IN_FAILURE_TRIAGE_PROMPT = "Can't sign in?" as const;

export const AUTHENTICATION_SIGN_IN_FAILURE_TRIAGE_LINKS = [
  {
    label: "Common sign-in issues",
    href: `#${AUTHENTICATION_SIGN_IN_COMMON_ISSUES_ANCHOR}`,
  },
  {
    label: "Account recovery",
    href: `#${AUTHENTICATION_SIGN_IN_ACCOUNT_RECOVERY_ANCHOR}`,
  },
  {
    label: "Report a problem",
    href: inAppHelpHref("report-a-problem"),
  },
] as const;
