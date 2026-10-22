import { describe, expect, it } from "vitest";

import {
  isOperatorSideRailAllowedKind,
  listOperatorSideRailAllowedEntries,
  listOperatorSideRailDemotedEntries,
  OPERATOR_SIDE_RAIL_ALLOWED_KINDS,
  OPERATOR_SIDE_RAIL_BANNED_KINDS,
  OPERATOR_SIDE_RAIL_INVENTORY,
} from "@/lib/operator/operator-side-rail-inventory";

describe("operator-side-rail-inventory (TB-1575)", () => {
  it("names the four allowed kinds from the design-system contract", () => {
    expect(OPERATOR_SIDE_RAIL_ALLOWED_KINDS).toEqual([
      "working-object",
      "master-detail",
      "live",
      "toc-wizard",
    ]);
    expect(OPERATOR_SIDE_RAIL_BANNED_KINDS).toEqual([
      "teaching",
      "static-scope",
      "about-aside",
    ]);
  });

  it("keeps allowlisted exemplars on named kinds only", () => {
    const allowed = listOperatorSideRailAllowedEntries();

    expect(allowed.length).toBeGreaterThanOrEqual(4);

    for (const entry of allowed) {
      expect(entry.kind).not.toBe("none");
      expect(isOperatorSideRailAllowedKind(entry.kind)).toBe(true);
    }

    const ids = allowed.map((entry) => entry.id);
    expect(ids).toContain("digests-browse");
    expect(ids).toContain("digests-schedule");
    expect(ids).toContain("run-detail-workspace");
    expect(ids).toContain("help-topic-toc");
  });

  it("demotes Teams/Slack and peer integration about-asides to single-column", () => {
    const demoted = listOperatorSideRailDemotedEntries();
    const ids = demoted.map((entry) => entry.id);

    expect(ids).toContain("integrations-slack");
    expect(ids).toContain("integrations-teams");
    expect(ids).toContain("integrations-azure-boards");
    expect(ids).toContain("integrations-servicenow");
    expect(ids).toContain("recurrence-schedules");
    expect(ids).toContain("advisory-schedules");

    for (const entry of demoted) {
      expect(entry.kind).toBe("none");
    }
  });

  it("uses unique inventory ids for TB-1576 allowlist extension", () => {
    const ids = OPERATOR_SIDE_RAIL_INVENTORY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
