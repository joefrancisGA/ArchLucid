import { describe, expect, it } from "vitest";

import {
  FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX,
  filterFeasibilityTransparencyTrailInferred,
  isStructuredFeasibilityDriverKey,
  parseFeasibilityVerdictDrivers,
} from "@/lib/feasibility-verdict-transparency-trail";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

describe("feasibility-verdict-transparency-trail", () => {
  it("parses blocking finding, policy, manifest, and requirement drivers", () => {
    const trail: TransparencyTrail = {
      asserted: [],
      inferred: [
        {
          key: `${FEASIBILITY_BLOCKING_FINDING_TRAIL_KEY_PREFIX}finding-42`,
          value: "Accepted finding finding-42 is Error or Critical.",
          confidence: 90,
        },
        {
          key: "policy.violation.CIS-1.1",
          value: "Encrypt data at rest",
          confidence: 85,
        },
        {
          key: "manifest.issue.DesignGap",
          value: "Missing recovery tier",
          confidence: 70,
        },
        {
          key: "requirement.uncovered.rto",
          value: "Document RTO for tier-1 workloads",
          confidence: 75,
        },
        {
          key: "custom.signal",
          value: "Left in raw trail",
          confidence: 60,
        },
      ],
      skipped: [],
    };

    const drivers = parseFeasibilityVerdictDrivers(trail);

    expect(drivers).toHaveLength(4);
    expect(drivers[0]).toMatchObject({
      kind: "blocking-finding",
      findingId: "finding-42",
      label: "Accepted finding finding-42 is Error or Critical.",
    });
    expect(drivers[1]).toMatchObject({ kind: "policy-violation", label: "Encrypt data at rest" });
    expect(drivers[2]).toMatchObject({ kind: "manifest-issue", label: "Missing recovery tier" });
    expect(drivers[3]).toMatchObject({
      kind: "uncovered-requirement",
      label: "Document RTO for tier-1 workloads",
    });

    const filtered = filterFeasibilityTransparencyTrailInferred(trail);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.key).toBe("custom.signal");
    expect(isStructuredFeasibilityDriverKey("policy.violation.foo")).toBe(true);
    expect(isStructuredFeasibilityDriverKey("other")).toBe(false);
  });
});
