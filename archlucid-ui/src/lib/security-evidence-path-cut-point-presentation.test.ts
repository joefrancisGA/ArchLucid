import { describe, expect, it } from "vitest";

import {
  formatCutPointHeadline,
  formatSecurityEvidencePathCutEndpointSuffix,
  SECURITY_EVIDENCE_PATH_CUT_ENDPOINT_PAIR_NOT_STORED,
} from "@/lib/security-evidence-path-cut-point-presentation";
import type { SecurityEvidencePathCutPoint } from "@/lib/security-evidence-path-types";

describe("formatSecurityEvidencePathCutEndpointSuffix", () => {
  it("renders a trimmed from→to pair", () => {
    expect(formatSecurityEvidencePathCutEndpointSuffix("  src ", " dst ")).toBe(" · src → dst");
  });

  it("degrades missing endpoints", () => {
    expect(formatSecurityEvidencePathCutEndpointSuffix(" ", " ")).toBe(
      ` · ${SECURITY_EVIDENCE_PATH_CUT_ENDPOINT_PAIR_NOT_STORED}`,
    );
  });
});

describe("formatCutPointHeadline", () => {
  it("includes cut kind and endpoints", () => {
    const cutPoint: SecurityEvidencePathCutPoint = {
      cutPointId: "cp-1",
      cutKind: "  network boundary ",
      fromNodeLabel: "a",
      toNodeLabel: "b",
      collapsedPathIds: [],
    };

    expect(formatCutPointHeadline(cutPoint)).toBe("network boundary · a → b");
  });
});