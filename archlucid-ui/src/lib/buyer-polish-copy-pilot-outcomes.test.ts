import { describe, expect, it } from "vitest";

import {
  PILOT_COMMAND_CENTER_OUTCOMES,
  PILOT_COMMAND_CENTER_OUTCOMES_HEADING,
} from "@/lib/buyer-polish-copy";

/** TB-351: hero outcomes use discovery framing — not artifact receipt bullets. */
describe("buyer-polish-copy pilot command center outcomes (TB-351)", () => {
  it("uses discovery heading and V1-defensible value outcomes", () => {
    expect(PILOT_COMMAND_CENTER_OUTCOMES_HEADING).toBe("What ArchLucid discovers");
    expect(PILOT_COMMAND_CENTER_OUTCOMES).toEqual([
      "Missing dependencies",
      "Hidden risks",
      "Cost drivers",
      "Governance gaps",
      "Evidence gaps",
      "Decision impact",
    ]);
  });

  it("does not regress to artifact receipt framing", () => {
    const joined = PILOT_COMMAND_CENTER_OUTCOMES.join(" ");

    expect(PILOT_COMMAND_CENTER_OUTCOMES_HEADING).not.toBe("What you'll get");
    expect(joined).not.toMatch(/Review trail|Governed decision record|^Findings$|^Decisions$/);
  });
});
