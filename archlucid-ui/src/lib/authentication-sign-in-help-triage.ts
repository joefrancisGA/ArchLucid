import { TROUBLESHOOTING_EMAIL_SUPPORT_LINK } from "@/lib/troubleshooting-help-guide-content";

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
    label: TROUBLESHOOTING_EMAIL_SUPPORT_LINK.label,
    href: TROUBLESHOOTING_EMAIL_SUPPORT_LINK.href,
  },
] as const;
