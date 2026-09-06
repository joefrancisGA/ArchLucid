import { describe, expect, it } from "vitest";

import {
  buildDriftWorkbenchHref,
  buildRemediationWorkbenchHref,
  buildResourceScopedWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";

describe("infra-evidence-workbench-url", () => {
  it("builds drift workbench links with snapshot and resource scope", () => {
    expect(
      buildDriftWorkbenchHref({
        snapshotId: "22222222-2222-2222-2222-222222222222",
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
      }),
    ).toBe(
      "/governance/infrastructure/drift?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
  });

  it("builds remediation workbench links scoped to a resource", () => {
    expect(buildRemediationWorkbenchHref({ cloudResourceId: "11111111-1111-1111-1111-111111111111" })).toBe(
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
  });

  it("routes work-count kinds to the expected destinations", () => {
    expect(buildResourceScopedWorkbenchHref("11111111-1111-1111-1111-111111111111", "findings")).toBe(
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings",
    );
    expect(buildResourceScopedWorkbenchHref("11111111-1111-1111-1111-111111111111", "remediation")).toBe(
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
  });
});
