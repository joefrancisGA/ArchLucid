import { AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION } from "@/lib/authentication-sign-in-help-copy";

/** TB-1614 — `/help/authentication-sign-in` ships a specialty companion, not bare markdown chrome. */
export const AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_SOURCE_FILES: readonly string[] = [
  "src/app/(operator)/help/_sections/HelpAuthenticationSignInGuideView.tsx",
  "src/app/(operator)/help/_sections/HelpAuthenticationSignInHeaderActions.tsx",
  "src/app/(operator)/help/[...topic]/page.tsx",
] as const;

export const AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_ROOT_TEST_ID = "help-authentication-sign-in-guide";

export const AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION_TEST_ID =
  AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.testId;

export const AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_DISPATCH_MARKERS: readonly string[] = [
  "HelpAuthenticationSignInGuideView",
  '"authentication-sign-in"',
] as const;

export function sourceDeclaresAuthenticationSignInHelpSpecialtyCompanion(
  guideViewSource: string,
  headerActionsSource: string,
): boolean {
  return (
    guideViewSource.includes(AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_ROOT_TEST_ID) &&
    guideViewSource.includes("HelpAuthenticationSignInActionPanel") &&
    headerActionsSource.includes("AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.testId") &&
    headerActionsSource.includes("AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.href")
  );
}

export function sourceDispatchesAuthenticationSignInHelpSpecialtyCompanion(topicPageSource: string): boolean {
  return AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_DISPATCH_MARKERS.every((marker) =>
    topicPageSource.includes(marker),
  );
}
