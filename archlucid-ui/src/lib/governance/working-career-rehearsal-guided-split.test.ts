import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { GUIDED_TEACHING_CHROME_SURFACE_IDS } from "@/lib/workspace-mode/guided-teaching-chrome-inventory";

const UI_ROOT = join(process.cwd());

const WORKING_CAREER_REHEARSAL_CHOOSER_RELATIVE_PATH =
  "src/components/workspace-mode/WorkingCareerRehearsalChooser.tsx";

const OPERATOR_SHELL_TOP_BAR_TEST_RELATIVE_PATH =
  "src/components/shell/OperatorShellTopBar.test.tsx";

const OPERATOR_UI_EXPERIENCE_MODES_DOC_RELATIVE_PATH =
  "../docs/library/OPERATOR_UI_EXPERIENCE_MODES.md";

/** Working-only surfaces that assert Career / Rehearsal chrome — Guided tests must not depend on these. */
const WORKING_CAREER_REHEARSAL_CHOOSER_TEST_FILES = [
  "src/components/workspace-mode/WorkingCareerRehearsalChooser.test.tsx",
  OPERATOR_SHELL_TOP_BAR_TEST_RELATIVE_PATH,
] as const;

describe("working-career-rehearsal guided split (AS-081 / WS-23)", () => {
  it("WorkingCareerRehearsalChooser is gated to Working workspace mode only", () => {
    const chooserSource = readFileSync(
      join(UI_ROOT, WORKING_CAREER_REHEARSAL_CHOOSER_RELATIVE_PATH),
      "utf8",
    );

    expect(chooserSource).toContain("isWorkingWorkspaceMode(mode)");
    expect(chooserSource).toContain("Hidden on Guided seats");
    expect(chooserSource).toContain("return null");
  });

  it("Career / Rehearsal chooser is not a Guided teaching chrome surface", () => {
    const inventory = GUIDED_TEACHING_CHROME_SURFACE_IDS.join("\n");

    expect(inventory).not.toContain("career-rehearsal");
    expect(inventory).not.toContain("working-career-rehearsal");
  });

  it("OperatorShellTopBar tests hide the chooser in Guided mode", () => {
    const topBarTestSource = readFileSync(
      join(UI_ROOT, OPERATOR_SHELL_TOP_BAR_TEST_RELATIVE_PATH),
      "utf8",
    );

    expect(topBarTestSource).toContain("hides the Career / Rehearsal chooser in Guided mode");
    expect(topBarTestSource).toContain(
      'expect(screen.queryByTestId("working-career-rehearsal-chooser")).not.toBeInTheDocument()',
    );
  });

  it("Working Career / Rehearsal chooser tests set Working mode before asserting chooser chrome", () => {
    for (const relativePath of WORKING_CAREER_REHEARSAL_CHOOSER_TEST_FILES) {
      const source = readFileSync(join(UI_ROOT, relativePath), "utf8");

      expect(source, `${relativePath} should gate chooser assertions on Working mode`).toMatch(
        /workspaceModeMock\.mode\s*=\s*"working"|mode:\s*"working"/,
      );
      expect(source, `${relativePath} should hide chooser in Guided mode`).toContain(
        'workspaceModeMock.mode = "guided"',
      );
    }
  });

  it("OPERATOR_UI_EXPERIENCE_MODES documents Career vs Rehearsal under Working", () => {
    const docSource = readFileSync(
      join(UI_ROOT, OPERATOR_UI_EXPERIENCE_MODES_DOC_RELATIVE_PATH),
      "utf8",
    );

    expect(docSource).toContain("Career");
    expect(docSource).toContain("Rehearsal");
    expect(docSource).toContain("AS-081");
    expect(docSource).toContain("WorkingCareerRehearsalChooser");
    expect(docSource).toContain("workingCareerRehearsalDoor");
    expect(docSource).toContain("CG-011");
  });
});
