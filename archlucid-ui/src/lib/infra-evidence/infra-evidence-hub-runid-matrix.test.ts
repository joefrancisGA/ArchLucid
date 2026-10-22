import { describe, expect, it } from "vitest";

import { resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

const cloudResourceId = "11111111-1111-1111-1111-111111111111";
const snapshotId = "22222222-2222-2222-2222-222222222222";
const runId = "run-1";
const AUDIT_SUFFIX =
  "&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc";

describe("resource hub runId preservation", () => {
  it("keeps runId on sibling tab links when audit scope is active", () => {
    const tabs = ["findings", "drift", "remediation", "terraform", "diagram"] as const;

    for (const tab of tabs) {
      expect(
        resourceHubFilterHrefFromSearch(cloudResourceId, `tab=diagram&runId=${runId}&snapshotId=${snapshotId}${AUDIT_SUFFIX}`, {
          tab,
        }),
      ).toContain(`runId=${runId}`);
    }
  });
});
