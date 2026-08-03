import { describe, expect, it } from "vitest";

import {
  buildSnapshotRedirectPath,
  resolveSnapshotRedirectDestination,
} from "@/lib/legacy-snapshot-redirect";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("legacy-snapshot-redirect (TB-1952 / TB-1955)", () => {
  it("resolves showcase leave-behind to the Claims Intake canonical review workspace", () => {
    expect(resolveSnapshotRedirectDestination(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    );
    expect(resolveSnapshotRedirectDestination("claims-intake-modernization-run")).toBe(
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    );
  });

  it("resolves tenant runs to their review workspace, not sponsor executive summary", () => {
    expect(resolveSnapshotRedirectDestination("pilot-run-42")).toBe("/architecture/reviews/pilot-run-42");
    expect(resolveSnapshotRedirectDestination("pilot-run-42")).not.toContain("/sponsor-report/");
  });

  it("builds readOnly=1 redirect targets for showcase and tenant runs", () => {
    expect(buildSnapshotRedirectPath("pilot-run-42", {})).toBe("/architecture/reviews/pilot-run-42?readOnly=1");
    expect(buildSnapshotRedirectPath(SHOWCASE_STATIC_DEMO_RUN_ID, { v: "demo" })).toBe(
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}?readOnly=1&v=demo`,
    );
  });
});
