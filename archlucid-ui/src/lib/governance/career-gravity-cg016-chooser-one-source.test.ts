import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { WORKING_CAREER_REHEARSAL_CHOOSER_TEST_ID } from "@/lib/governance/working-career-rehearsal-chooser-keyboard";

const UI_ROOT = join(process.cwd());
const REPO_ROOT = join(process.cwd(), "..");

const CANONICAL_CHOOSER = "src/components/workspace-mode/WorkingCareerRehearsalChooser.tsx";
const GOVERNANCE_REEXPORT = "src/components/governance/WorkingCareerRehearsalChooser.tsx";
const FINDINGS_WORKSPACE =
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.tsx";
const TOP_BAR = "src/components/shell/OperatorShellTopBar.tsx";

describe("CG-016 chooser one source of truth", () => {
  it("keeps a single implementation and a governance re-export", () => {
    const canonical = readFileSync(join(UI_ROOT, CANONICAL_CHOOSER), "utf8");
    const reexport = readFileSync(join(UI_ROOT, GOVERNANCE_REEXPORT), "utf8");
    const findings = readFileSync(join(UI_ROOT, FINDINGS_WORKSPACE), "utf8");
    const topBar = readFileSync(join(UI_ROOT, TOP_BAR), "utf8");

    expect(canonical).toContain("export function WorkingCareerRehearsalChooser");
    expect(canonical).toContain("Hidden on Guided seats");
    expect(canonical).toContain("isWorkingWorkspaceMode(mode)");
    expect(canonical).toContain("enableArrowKeyboard");
    expect(canonical).toContain("shouldRegisterWorkingCareerRehearsalChooserShortcut");
    expect(canonical).not.toContain("AgentExecution:Mode");

    expect(reexport).toContain(
      'from "@/components/workspace-mode/WorkingCareerRehearsalChooser"',
    );
    expect(reexport).not.toContain("export function WorkingCareerRehearsalChooser");

    expect(findings).toContain(
      'from "@/components/governance/WorkingCareerRehearsalChooser"',
    );
    expect(findings).toContain('source="findings"');

    expect(topBar).toContain(
      'from "@/components/workspace-mode/WorkingCareerRehearsalChooser"',
    );
    expect(topBar).not.toContain("from \"@/components/governance/WorkingCareerRehearsalChooser\"");
  });

  it("uses one test id family for command bar and findings", () => {
    const canonical = readFileSync(join(UI_ROOT, CANONICAL_CHOOSER), "utf8");
    const as077 = readFileSync(
      join(
        REPO_ROOT,
        "ArchLucid.Architecture.Tests/ArchitectureSpineAs077WorkingChromeModeChooserArchitectureTests.cs",
      ),
      "utf8",
    );

    expect(WORKING_CAREER_REHEARSAL_CHOOSER_TEST_ID).toBe("working-career-rehearsal-chooser");
    expect(canonical).toContain("WORKING_CAREER_REHEARSAL_CHOOSER_TEST_ID");
    expect(canonical).toContain("data-chooser-source");
    expect(as077).toContain("As077_top_bar_mounts_working_door_chooser");
  });
});
