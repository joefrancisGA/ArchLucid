import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceCompletenessWarningsStatusTagKind } from "@/lib/infra-evidence/resolve-infra-evidence-completeness-warnings-status-tag-kind";

describe("resolveInfraEvidenceCompletenessWarningsStatusTagKind", () => {
  it("uses blocked for rbac scope warnings", () => {
    expect(
      resolveInfraEvidenceCompletenessWarningsStatusTagKind(["rbac-scope-too-broad:/subscriptions/sub"]),
    ).toBe("blocked");
  });

  it("uses needs-attention for collection gaps", () => {
    expect(
      resolveInfraEvidenceCompletenessWarningsStatusTagKind(["app-settings-not-collected-hosted-get-only"]),
    ).toBe("needs-attention");
  });
});
