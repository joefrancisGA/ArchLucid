import { describe, expect, it } from "vitest";

import { SECURENOW_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";

import {
  resolveSecureNowCollectionReadyNextHref,
  resolveSecureNowCollectionReadyNextLinkLabel,
  SECURENOW_COLLECTION_READY_NEXT_SUMMARY,
} from "./securenow-collection-setup-ready-copy";

describe("securenow collection setup ready copy", () => {
  it("sends operators to drift with a snapshot or Path inspect without one", () => {
    expect(resolveSecureNowCollectionReadyNextHref(null)).toBe(SECURENOW_REMEDIATION_FACTORY_PATH);
    expect(resolveSecureNowCollectionReadyNextHref("snap-9")).toBe(
      `${SECURENOW_INFRASTRUCTURE_DRIFT_PATH}?snapshotId=snap-9`,
    );
    expect(resolveSecureNowCollectionReadyNextLinkLabel(null)).toMatch(/Path inspect/i);
    expect(resolveSecureNowCollectionReadyNextLinkLabel("snap-9")).toMatch(/Changes and drift/i);
    expect(SECURENOW_COLLECTION_READY_NEXT_SUMMARY).toMatch(/blank ranking/i);
  });
});
