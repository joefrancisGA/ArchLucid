import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_LABEL,
  GOVERNANCE_OVERVIEW_FINDINGS_ACTION,
  GOVERNANCE_OVERVIEW_HEADER_NEXT_ACTION,
} from "@/lib/governance/governance-overview-copy";

describe("governance overview findings naming guard (GOP P0-3)", () => {
  it("keeps canonical finding noun on overview affordances", () => {
    expect(GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_LABEL.toLowerCase()).toContain("finding");
    expect(GOVERNANCE_OVERVIEW_FINDINGS_ACTION.toLowerCase()).toContain("finding");
    expect(GOVERNANCE_OVERVIEW_HEADER_NEXT_ACTION.toLowerCase()).toContain("finding");
    expect(GOVERNANCE_OVERVIEW_FINDINGS_ACTION.toLowerCase()).not.toContain("risk register");
    expect(GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_LABEL.toLowerCase()).not.toContain("alert");
  });

  it("keeps overview panel and copy aligned to findings queue route", () => {
    const panelSource = readFileSync(
      join(process.cwd(), "src", "app", "(operator)", "governance", "_sections", "GovernanceOverviewPanel.tsx"),
      "utf8",
    );
    const copySource = readFileSync(
      join(process.cwd(), "src", "lib", "governance", "governance-overview-copy.ts"),
      "utf8",
    );

    expect(panelSource).toContain("GOVERNANCE_OVERVIEW_FINDINGS_ACTION");
    expect(panelSource).toContain("GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_LABEL");
    expect(panelSource).toContain("GOVERNANCE_FINDINGS_PATH");
    expect(panelSource).not.toMatch(/risk register/i);
    expect(panelSource).not.toMatch(/Blocking governance alerts/i);
    expect(copySource).not.toMatch(/GOVERNANCE_OVERVIEW_RISK_REGISTER_ACTION/);
    expect(copySource).not.toMatch(/GOVERNANCE_OVERVIEW_BLOCKING_ALERTS_LABEL/);
  });
});
