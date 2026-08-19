import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER,
  GUIDED_INTAKE_DRAFT_GUIDANCE_CALLOUT,
  GUIDED_INTAKE_NOT_READY_RECEIPT_TITLE,
  GUIDED_INTAKE_READINESS_SUCCESS_TOAST,
  GUIDED_INTAKE_READY_DRAFT_CLAIM_LABEL,
  GUIDED_INTAKE_STEP2_CARD_DESCRIPTION,
  GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION,
} from "@/lib/guided-intake-copy";
import { REVIEWS_NEW_PATH_HINTS } from "@/lib/reviews-new-path-copy";

const GUIDED_INTAKE_BANNED_BUYER_PHRASES = [
  /admission gates?/i,
  /\badmitted\b/i,
  /socratic/i,
  /authority pipeline/i,
] as const;

const GUIDED_INTAKE_BANNED_INLINE_STRING_FRAGMENTS = [
  "Submit the admitted draft",
  "Draft admitted",
  "authority pipeline",
  "intake not admitted",
  "Admitted draft",
] as const;

function readUiRelativeUtf8(pathFromUiRoot: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", pathFromUiRoot), "utf8");
}

function expectNoBannedBuyerPhrases(values: readonly string[], label: string): void {
  for (const value of values) {
    for (const pattern of GUIDED_INTAKE_BANNED_BUYER_PHRASES) {
      expect(value, `${label} must not expose ${pattern}`).not.toMatch(pattern);
    }
  }
}

describe("guided-intake-copy (TB-773)", () => {
  it("uses cloud-neutral creation overview placeholder", () => {
    expect(GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER).toMatch(/private networking/i);
    expect(GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER).not.toMatch(/\bAzure\b/i);
    expect(GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER).not.toMatch(/Entra/i);
  });
});

describe("guided-intake buyer jargon (TB-1878)", () => {
  it("uses readiness-check vocabulary in guided intake copy constants", () => {
    expect(GUIDED_INTAKE_READINESS_SUCCESS_TOAST).toMatch(/readiness checks passed/i);
    expect(GUIDED_INTAKE_STEP2_CARD_DESCRIPTION).toMatch(/submit your answers/i);
    expect(GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION).not.toMatch(/authority pipeline/i);
    expect(GUIDED_INTAKE_READY_DRAFT_CLAIM_LABEL).toMatch(/ready to submit/i);
    expect(GUIDED_INTAKE_NOT_READY_RECEIPT_TITLE).toMatch(/review not started/i);
    expect(GUIDED_INTAKE_DRAFT_GUIDANCE_CALLOUT).not.toMatch(/admission/i);
  });

  it("keeps guided-intake path hint free of admission-gate jargon", () => {
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).not.toMatch(/admission gates?/i);
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).toMatch(/readiness checks/i);
  });

  it("forbids admission/Socratic jargon in guided intake buyer copy constants", () => {
    expectNoBannedBuyerPhrases(
      [
        GUIDED_INTAKE_DRAFT_GUIDANCE_CALLOUT,
        GUIDED_INTAKE_READINESS_SUCCESS_TOAST,
        GUIDED_INTAKE_STEP2_CARD_DESCRIPTION,
        GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION,
        GUIDED_INTAKE_READY_DRAFT_CLAIM_LABEL,
        GUIDED_INTAKE_NOT_READY_RECEIPT_TITLE,
        REVIEWS_NEW_PATH_HINTS["guided-intake"],
      ],
      "guided-intake buyer copy",
    );
  });

  it("forbids reintroducing banned guided intake inline string literals", () => {
    const wizardSource = readUiRelativeUtf8(
      "src/app/(operator)/architecture/reviews/new/SocraticIntakeWizard.tsx",
    );

    for (const fragment of GUIDED_INTAKE_BANNED_INLINE_STRING_FRAGMENTS) {
      expect(wizardSource, `SocraticIntakeWizard.tsx`).not.toContain(fragment);
    }
  });
});
