import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(process.cwd());

/** Highest-traffic TB-2010 surfaces; recurrence / architecture-intelligence deferred (lower traffic). */
const TB_2010_SOURCE_ROOTS = [
  "src/components/marketing/SignupForm.tsx",
  "src/app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx",
  "src/components/alerts/AlertRoutingContent.tsx",
  "src/app/(operator)/architecture/reviews/new/SocraticIntakeWizard.tsx",
  "src/app/(operator)/architecture/reviews/new/NewRunWizardClient.tsx",
] as const;

const TB_2010_BAND_TEST_FILES = [
  "src/components/marketing/SignupForm.test.tsx",
  "src/components/alerts/AlertRoutingContent.test.tsx",
] as const;

function readSrc(relativePath: string): string {
  return readFileSync(join(UI_ROOT, relativePath), "utf8");
}

describe("disable-until-ready inventory band regression (TB-2010)", () => {
  it("documents TB-2010 guarded surfaces and sibling Vitest files", () => {
    expect(readSrc(TB_2010_BAND_TEST_FILES[0])).toContain("TB-2010");
    expect(readSrc(TB_2010_BAND_TEST_FILES[1])).toContain("keeps create disabled");
  });

  it("gates marketing signup primary until zod validation passes", () => {
    const signup = readSrc(TB_2010_SOURCE_ROOTS[0]);

    expect(signup).toContain("TB-2010");
    expect(signup).toContain("canSubmit");
    expect(signup).toMatch(/disabled=\{submitting \|\| !canSubmit\}/);
  });

  it("gates webhooks Save until webhook settings schema passes", () => {
    const webhooks = readSrc(TB_2010_SOURCE_ROOTS[1]);

    expect(webhooks).toContain("canSubmitForm");
    expect(webhooks).toMatch(/disabled=\{!canMutate \|\| loading \|\| isSaving \|\| !canSubmitForm\}/);
  });

  it("gates alert routing Create until destination form is valid", () => {
    const alertRouting = readSrc(TB_2010_SOURCE_ROOTS[2]);

    expect(alertRouting).toContain("formValid");
    expect(alertRouting).toMatch(/disabled=\{!canEditRouting \|\| creating \|\| !formValid\}/);
  });

  it("gates review-start wizards on readiness predicates before submit", () => {
    const socratic = readSrc(TB_2010_SOURCE_ROOTS[3]);
    const templates = readSrc(TB_2010_SOURCE_ROOTS[4]);

    expect(socratic).toContain("canSubmit");
    expect(socratic).toMatch(/disabled=\{!canSubmit\}/);
    expect(templates).toContain("canSubmit");
    expect(templates).toMatch(/canSubmit=\{canSubmit\}/);
  });
});
