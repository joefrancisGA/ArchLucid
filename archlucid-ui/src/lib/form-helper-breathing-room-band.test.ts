import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  OPERATOR_FORM_CONTROL_DESCRIPTION_GAP_CLASS,
  OPERATOR_FORM_FIELD_HELPER_CLASS,
  OPERATOR_FORM_FIELD_STACK_CLASS,
} from "@/lib/design-tokens";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const FORM_BREATHING_ROOM_BAND_TEST_FILES = [
  "src/lib/operator-form-field-breathing-room-contract.test.ts",
  "src/lib/start-review-form-primitives-breathing-room.test.ts",
] as const;

const TB_2003_PRIMITIVE_SOURCE_ROOTS = [
  "src/components/wizard/WizardFieldHint.tsx",
  "src/app/(operator)/architecture/reviews/new/ReviewsNewPathSwitcher.tsx",
  "src/components/wizard/PilotModePolicyPackToggle.tsx",
  "src/components/draft-intake/DraftIntakeActorEditor.tsx",
] as const;

function readUiUtf8(pathFromUiRoot: string): string {
  return readFileSync(join(UI_ROOT, pathFromUiRoot), "utf8");
}

describe("form helper breathing room band regression (TB-2003)", () => {
  it("keeps sibling Vitest guards for TB-2000 through TB-2002 on disk", () => {
    for (const relativePath of FORM_BREATHING_ROOM_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("asserts TB-2000 minimum stack tokens remain exported", () => {
    expect(OPERATOR_FORM_FIELD_STACK_CLASS).toContain("space-y-3");
    expect(OPERATOR_FORM_FIELD_HELPER_CLASS).toContain("leading-relaxed");
    expect(OPERATOR_FORM_CONTROL_DESCRIPTION_GAP_CLASS).toContain("gap-3");
  });

  it("forbids flush label-to-helper packing on shared Start review primitives (TB-2003)", () => {
    for (const relativePath of TB_2003_PRIMITIVE_SOURCE_ROOTS) {
      const source = readUiUtf8(relativePath);

      expect(source).not.toContain("leading-none");
      expect(source).not.toMatch(/\bmb-1\b/);
    }

    const wizardFieldHint = readUiUtf8("src/components/wizard/WizardFieldHint.tsx");

    expect(wizardFieldHint).toContain("OPERATOR_FORM_FIELD_LABEL_CLASS");
    expect(wizardFieldHint).not.toMatch(/\bmb-1\b/);
  });

  it("keeps guided intake step-0 field stacks on TB-2000 tokens (TB-2003 golden)", () => {
    const guidedIntake = readUiUtf8(
      "src/app/(operator)/architecture/reviews/new/SocraticIntakeWizard.tsx",
    );

    const step0Start = guidedIntake.indexOf("{step === 0 ? (");
    const step1Start = guidedIntake.indexOf("{step === 1 ? (");

    expect(step0Start).toBeGreaterThan(-1);
    expect(step1Start).toBeGreaterThan(step0Start);

    const step0Block = guidedIntake.slice(step0Start, step1Start);

    expect(step0Block).toContain("OPERATOR_FORM_FIELD_STACK_CLASS");
    expect(step0Block).toContain("OPERATOR_FORM_FIELD_HELPER_CLASS");
    expect(step0Block).not.toContain("space-y-1");
    expect(step0Block).not.toMatch(/\bmt-1\b/);
  });
});
