import { describe, expect, it } from "vitest";

import {
  CLARIFICATIONS_FINDINGS_COMPACT_LINE,
  CLARIFICATIONS_FINDINGS_HEADING,
  CLARIFICATIONS_FINDINGS_WHY_TWO,
  buildClarificationsFindingsVocabulary,
  resolveClarificationsFindingsPeerLink,
} from "@/lib/vocabulary/clarifications-findings-vocabulary";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture/architecture-workspace-tabs";

describe("clarifications-findings-vocabulary (TB-2298)", () => {
  it("explains clarifications gaps vs findings triage with run-scoped archTab links", () => {
    const model = buildClarificationsFindingsVocabulary("run-abc");

    expect(model.heading).toBe(CLARIFICATIONS_FINDINGS_HEADING);
    expect(model.whyTwo).toBe(CLARIFICATIONS_FINDINGS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("gaps");
    expect(model.whyTwo.toLowerCase()).toContain("findings");
    expect(model.compactLine).toBe(CLARIFICATIONS_FINDINGS_COMPACT_LINE);

    expect(model.clarificationsLink.href).toBe(
      buildArchitectureWorkspaceTabHref("run-abc", "clarifications"),
    );
    expect(model.findingsLink.href).toBe(buildArchitectureWorkspaceTabHref("run-abc", "findings"));
  });

  it("resolves the peer surface from clarifications and findings", () => {
    const model = buildClarificationsFindingsVocabulary("run-abc");

    expect(resolveClarificationsFindingsPeerLink("clarifications", model)).toEqual(
      model.findingsLink,
    );

    expect(resolveClarificationsFindingsPeerLink("findings", model)).toEqual(
      model.clarificationsLink,
    );
  });
});
