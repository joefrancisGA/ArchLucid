import { AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION } from "@/lib/authentication-sign-in-help-copy";
import {
  AUTHENTICATION_SIGN_IN_ACCOUNT_RECOVERY_ANCHOR,
  AUTHENTICATION_SIGN_IN_COMMON_ISSUES_ANCHOR,
} from "@/lib/authentication-sign-in-help-triage";

export const AUTHENTICATION_SIGN_IN_HELP_ACTION_PANEL_TITLE = "Sign in to your workspace" as const;

export const AUTHENTICATION_SIGN_IN_HELP_ACTION_LEAD =
  "ArchLucid uses passwordless sign-in. Pick the method that fits your organization, then return to sign in when you are ready." as const;

export const AUTHENTICATION_SIGN_IN_HELP_EVALUATION_SUMMARY =
  "Start a self-serve evaluation workspace after organization verification." as const;

export const AUTHENTICATION_SIGN_IN_HELP_INVITATION_SUMMARY =
  "Open the invitation link from your workspace administrator and confirm the email you use to sign in." as const;

export const AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS = {
  startEvaluation: {
    label: "Start your evaluation",
    href: "/signup",
    testId: "help-authentication-sign-in-start-evaluation",
  },
  acceptInvitation: {
    label: "Accept an invitation",
    href: `#accepting-an-invitation`,
    testId: "help-authentication-sign-in-accept-invitation",
  },
} as const;

export const AUTHENTICATION_SIGN_IN_HELP_COLLAPSIBLE_SECTIONS = {
  commonIssues: {
    title: "Common sign-in issues",
    anchor: AUTHENTICATION_SIGN_IN_COMMON_ISSUES_ANCHOR,
    testId: "help-authentication-sign-in-common-issues",
  },
  accountRecovery: {
    title: "Account recovery",
    anchor: AUTHENTICATION_SIGN_IN_ACCOUNT_RECOVERY_ANCHOR,
    testId: "help-authentication-sign-in-account-recovery",
  },
  enterpriseSso: {
    title: "Enterprise SSO (optional and enforced)",
    anchor: "enterprise-sso-optional-and-enforced",
    testId: "help-authentication-sign-in-enterprise-sso",
  },
  acceptingInvitation: {
    title: "Accepting an invitation",
    anchor: "accepting-an-invitation",
    testId: "help-authentication-sign-in-accepting-invitation",
  },
} as const;

export const AUTHENTICATION_SIGN_IN_HELP_SECTION_HEADINGS = {
  howSignInWorks: "## How sign-in works",
  commonIssues: "## Common sign-in issues",
  accountRecovery: "## Account recovery",
  startingEvaluation: "## Starting an evaluation workspace",
  acceptingInvitation: "## Accepting an invitation",
  enterpriseSso: "## Enterprise SSO (optional and enforced)",
  securityPrivacy: "## Security and privacy",
  related: "## Related",
} as const;

export type AuthenticationSignInHelpMarkdownSections = {
  readonly introMarkdown: string;
  readonly howSignInWorksMarkdown: string;
  readonly commonIssuesMarkdown: string;
  readonly accountRecoveryMarkdown: string;
  readonly startingEvaluationMarkdown: string;
  readonly acceptingInvitationMarkdown: string;
  readonly enterpriseSsoMarkdown: string;
  readonly securityPrivacyMarkdown: string;
  readonly relatedMarkdown: string;
};

function findSectionStart(markdown: string, heading: string): number {
  return markdown.indexOf(heading);
}

function sliceSection(markdown: string, heading: string, nextHeadings: readonly string[]): string {
  const start = findSectionStart(markdown, heading);

  if (start < 0) {
    return "";
  }

  let end = markdown.length;

  for (const nextHeading of nextHeadings) {
    const nextStart = findSectionStart(markdown.slice(start + heading.length), nextHeading);

    if (nextStart < 0) {
      continue;
    }

    const absoluteNext = start + heading.length + nextStart;

    if (absoluteNext < end) {
      end = absoluteNext;
    }
  }

  return markdown.slice(start, end).trim();
}

/** Splits authentication help markdown into specialty chrome sections (TB-1614–TB-1616). */
export function splitAuthenticationSignInHelpMarkdown(markdown: string): AuthenticationSignInHelpMarkdownSections {
  const headings = AUTHENTICATION_SIGN_IN_HELP_SECTION_HEADINGS;
  const howStart = findSectionStart(markdown, headings.howSignInWorks);
  const introMarkdown = howStart > 0 ? markdown.slice(0, howStart).trim() : markdown.trim();

  return {
    introMarkdown,
    howSignInWorksMarkdown: sliceSection(markdown, headings.howSignInWorks, [
      headings.commonIssues,
      headings.accountRecovery,
      headings.startingEvaluation,
      headings.acceptingInvitation,
      headings.enterpriseSso,
      headings.securityPrivacy,
      headings.related,
    ]),
    commonIssuesMarkdown: sliceSection(markdown, headings.commonIssues, [
      headings.accountRecovery,
      headings.startingEvaluation,
      headings.acceptingInvitation,
      headings.enterpriseSso,
      headings.securityPrivacy,
      headings.related,
    ]),
    accountRecoveryMarkdown: sliceSection(markdown, headings.accountRecovery, [
      headings.startingEvaluation,
      headings.acceptingInvitation,
      headings.enterpriseSso,
      headings.securityPrivacy,
      headings.related,
    ]),
    startingEvaluationMarkdown: sliceSection(markdown, headings.startingEvaluation, [
      headings.acceptingInvitation,
      headings.enterpriseSso,
      headings.securityPrivacy,
      headings.related,
    ]),
    acceptingInvitationMarkdown: sliceSection(markdown, headings.acceptingInvitation, [
      headings.enterpriseSso,
      headings.securityPrivacy,
      headings.related,
    ]),
    enterpriseSsoMarkdown: sliceSection(markdown, headings.enterpriseSso, [
      headings.securityPrivacy,
      headings.related,
    ]),
    securityPrivacyMarkdown: sliceSection(markdown, headings.securityPrivacy, [headings.related]),
    relatedMarkdown: sliceSection(markdown, headings.related, []),
  };
}

export { AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION };
