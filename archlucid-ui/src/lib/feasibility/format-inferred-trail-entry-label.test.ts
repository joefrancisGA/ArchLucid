import { describe, expect, it } from "vitest";

import {
  buildInferredTrailFindingTrustLookup,
  formatInferredTrailEntryLabel,
} from "@/lib/feasibility/format-inferred-trail-entry-label";
import { FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX } from "@/lib/feasibility-verdict-transparency-trail";

describe("formatInferredTrailEntryLabel (FC-14)", () => {
  it("appends wire trust label for blocking finding inferred rows", () => {
    const lookup = buildInferredTrailFindingTrustLookup([
      {
        findingId: "f-1",
        title: "Encrypt data at rest",
        recommendation: "Enable encryption",
        severityValue: 3,
        findingOrder: 0,
        aiReasoning: {},
        isMuted: false,
        muteReason: null,
        enforcementTier: "Blocking",
        trustLabel: "Heuristic",
        trustLabelReason: "No graph citation on this finding.",
      } as never,
    ]);

    const label = formatInferredTrailEntryLabel(
      {
        key: `${FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX}f-1`,
        value: "Encrypt data at rest",
        confidence: 85,
      },
      lookup,
    );

    expect(label).toContain("Heuristic");
    expect(label).toContain("No graph citation on this finding.");
    expect(label).not.toMatch(/^finding\.blocking\./);
  });

  it("falls back to key/value/confidence when no finding trust lookup exists", () => {
    const label = formatInferredTrailEntryLabel({
      key: "policy.violation.CIS-1.1",
      value: "Encrypt data at rest",
      confidence: 85,
    });

    expect(label).toBe("policy.violation.CIS-1.1: Encrypt data at rest (confidence 85)");
  });
});
