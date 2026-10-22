import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_TWO_CONTROLS_BODY,
} from "@/lib/inhabit/inhabit-help-guide-content";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit mode matrix guard (IH-028 / IH-029 / IH-032)", () => {
  it("documents two customer controls and host Mode as honesty only (IH-028)", () => {
    expect(INHABIT_THE_ARCHITECTURE_HELP_TWO_CONTROLS_BODY).toContain("two customer controls");
    expect(INHABIT_THE_ARCHITECTURE_HELP_TWO_CONTROLS_BODY).toContain("not as a third peer chooser");
  });

  it("documents Record + Simulator incompleteness without Career blocked (IH-029)", () => {
    expect(INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY).toContain("Record");
    expect(INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY).toContain("Simulator");
    expect(INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY).toContain('not “Record blocked,”');
  });

  it("keeps Working execute chrome on Record/Practice, not a host AgentExecution Mode picker (IH-032)", () => {
    const chooserSource = readFileSync(
      join(SRC_ROOT, "components/workspace-mode/WorkingCareerRehearsalChooser.tsx"),
      "utf8",
    );
    const commandBar = readFileSync(
      join(SRC_ROOT, "components/architecture/ArchitectureIdentityDeskCommandBar.tsx"),
      "utf8",
    );

    expect(chooserSource).toContain("labelForWorkingCareerRehearsalDoor");
    expect(chooserSource).toContain("WORKING_CAREER_REHEARSAL_CHOOSER_ARIA_LABEL");
    expect(chooserSource).not.toMatch(/AgentExecution:Mode picker/i);
    expect(commandBar).not.toMatch(/AgentExecution/i);
    expect(commandBar).toContain("WorkingRecordSimulatorStartHonestyNotice");
  });
});
