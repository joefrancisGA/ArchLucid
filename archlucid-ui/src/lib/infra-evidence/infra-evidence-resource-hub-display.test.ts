import { describe, expect, it } from "vitest";

import {
  formatResourceHubFindingStreamCaption,
  remediationInstanceStatusTagKind,
  resolveDiagramCorrespondenceConfidenceStatusKind,
  resolveDiagramCorrespondenceStatusKind,
} from "@/lib/infra-evidence/infra-evidence-resource-hub-display";

describe("infra-evidence-resource-hub-display", () => {
  it("maps diagram correspondence match kinds to status tag kinds", () => {
    expect(resolveDiagramCorrespondenceStatusKind("Exact", "Confirmed")).toBe("ready");
    expect(resolveDiagramCorrespondenceStatusKind("Probable", "Likely")).toBe("ready");
    expect(resolveDiagramCorrespondenceStatusKind("Probable", "Possible")).toBe("needs-attention");
    expect(resolveDiagramCorrespondenceStatusKind("Conflict", "Likely")).toBe("blocked");
    expect(resolveDiagramCorrespondenceStatusKind("Possible", "Possible")).toBe("needs-attention");
    expect(resolveDiagramCorrespondenceStatusKind("DiagramOnly", "InsufficientEvidence")).toBe("blocked");
  });

  it("maps confidence bands to status tag kinds", () => {
    expect(resolveDiagramCorrespondenceConfidenceStatusKind("Confirmed")).toBe("ready");
    expect(resolveDiagramCorrespondenceConfidenceStatusKind("InsufficientEvidence")).toBe("needs-attention");
  });

  it("maps remediation instance status strings", () => {
    expect(remediationInstanceStatusTagKind("PreflightBlocked")).toBe("blocked");
    expect(remediationInstanceStatusTagKind("Verified")).toBe("approved");
    expect(remediationInstanceStatusTagKind("Classified")).toBe("in-progress");
  });

  it("formats paginated finding stream captions", () => {
    expect(formatResourceHubFindingStreamCaption(20, 40, true)).toBe("Showing 20 of 40");
    expect(formatResourceHubFindingStreamCaption(5, 5, false)).toBeNull();
  });
});
