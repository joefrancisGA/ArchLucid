import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION_TEST_ID,
  AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_ROOT_TEST_ID,
  AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_SOURCE_FILES,
  sourceDeclaresAuthenticationSignInHelpSpecialtyCompanion,
  sourceDispatchesAuthenticationSignInHelpSpecialtyCompanion,
} from "@/lib/authentication-sign-in-help-specialty-guard-surfaces";

function readSpecialtyGuardSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("authentication-sign-in specialty companion guard (TB-1614)", () => {
  it("keeps sign-in help on HelpAuthenticationSignInGuideView with return-to-sign-in CTA chrome", () => {
    const guideViewSource = readSpecialtyGuardSource(AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_SOURCE_FILES[0]!);
    const headerActionsSource = readSpecialtyGuardSource(AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_SOURCE_FILES[1]!);
    const topicPageSource = readSpecialtyGuardSource(AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_SOURCE_FILES[2]!);

    expect(sourceDeclaresAuthenticationSignInHelpSpecialtyCompanion(guideViewSource, headerActionsSource)).toBe(
      true,
    );
    expect(sourceDispatchesAuthenticationSignInHelpSpecialtyCompanion(topicPageSource)).toBe(true);
  });

  it("documents specialty root and primary CTA test ids for reviewers", () => {
    expect(AUTHENTICATION_SIGN_IN_HELP_SPECIALTY_ROOT_TEST_ID).toBe("help-authentication-sign-in-guide");
    expect(AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION_TEST_ID).toBe("help-authentication-sign-in-return");
  });
});
