import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  RECORD_PRACTICE_ADR_0097_ACCEPTED_STATUSES,
  RECORD_PRACTICE_ADR_0097_RELATIVE_PATH,
} from "@/lib/record-practice-adr-inventory";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { parseWorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

const REPO_ROOT = join(process.cwd(), "..");

describe("record-practice ADR guard (RP-001 / ADR 0097)", () => {
  it("ADR 0097 is Accepted and central labels are Record / Practice", () => {
    const adrPath = join(REPO_ROOT, RECORD_PRACTICE_ADR_0097_RELATIVE_PATH);

    expect(existsSync(adrPath), RECORD_PRACTICE_ADR_0097_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");
    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch).not.toBeNull();
    expect(RECORD_PRACTICE_ADR_0097_ACCEPTED_STATUSES).toContain(statusMatch![1]);

    expect(WORKING_CAREER_DOOR_LABEL).toBe("Record");
    expect(WORKING_REHEARSAL_DOOR_LABEL).toBe("Practice");
    expect(parseWorkingCareerRehearsalDoorId("career")).toBe("career");
    expect(parseWorkingCareerRehearsalDoorId("rehearsal")).toBe("rehearsal");
    expect(parseWorkingCareerRehearsalDoorId("record")).toBe("career");
    expect(parseWorkingCareerRehearsalDoorId("practice")).toBe("rehearsal");
  });
});
