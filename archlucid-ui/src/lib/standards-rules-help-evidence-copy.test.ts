import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  STANDARDS_RULES_HELP_ORIENTATION_SOURCES,
  STANDARDS_RULES_HELP_SOURCES,
} from "@/lib/standards-rules-help-evidence-copy";

describe("standards-rules-help-evidence-copy", () => {
  it("excludes header and definition-tile destinations from orientation Sources", () => {
    const orientationHrefs = STANDARDS_RULES_HELP_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(GOVERNANCE_STANDARDS_AND_RULES_PATH);
    expect(orientationHrefs).not.toContain(GOVERNANCE_FINDINGS_PATH);
    expect(orientationHrefs).not.toContain(GOVERNANCE_POLICY_PACKS_PATH);
    expect(STANDARDS_RULES_HELP_ORIENTATION_SOURCES.length).toBeLessThan(STANDARDS_RULES_HELP_SOURCES.length);
    expect(STANDARDS_RULES_HELP_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
