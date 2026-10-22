import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceCitationHubTab } from "@/lib/infra-evidence/infra-evidence-citation-hub-tab";

describe("resolveInfraEvidenceCitationHubTab", () => {
  it("prefers explicit hubTab from Ask session context", () => {
    expect(
      resolveInfraEvidenceCitationHubTab(
        { kind: "CloudResourceId", id: "11111111-1111-1111-1111-111111111111", label: "gateway" },
        { hubTab: "terraform" },
      ),
    ).toBe("terraform");
  });

  it("infers drift tab from diff scope", () => {
    expect(
      resolveInfraEvidenceCitationHubTab(
        { kind: "CloudResourceId", id: "11111111-1111-1111-1111-111111111111", label: "gateway" },
        { diffId: "diff-1" },
      ),
    ).toBe("drift");
  });
});
