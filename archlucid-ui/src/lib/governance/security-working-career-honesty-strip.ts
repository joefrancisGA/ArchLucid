/** CG-017 — Security product line skips the Career / Rehearsal chooser; honesty still required. */

export const SECURITY_WORKING_CAREER_HONESTY_STRIP_TEST_ID =
  "security-working-career-honesty-strip" as const;

export const SECURITY_WORKING_CAREER_HONESTY_STRIP_HELP_TEST_ID =
  "security-working-career-honesty-strip-help" as const;

export type SecurityWorkingCareerHonestyStripVisibilityArgs = {
  readonly productLine: string | null | undefined;
  readonly workspaceMode: string | null | undefined;
  readonly workspaceMounted: boolean;
  readonly buyerPolishedEvalChrome: boolean;
};

/**
 * Compact labeled strip — not a chooser. Hidden door is not honest door.
 * Demo / trial / static seats keep eval chrome without Career gravity.
 */
export function shouldShowSecurityWorkingCareerHonestyStrip(
  args: SecurityWorkingCareerHonestyStripVisibilityArgs,
): boolean {
  if (!args.workspaceMounted) {
    return false;
  }

  if (args.buyerPolishedEvalChrome) {
    return false;
  }

  if (args.productLine !== "security") {
    return false;
  }

  return args.workspaceMode === "working";
}
