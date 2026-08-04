import { describe, expect, it } from "vitest";

import {
  buildSnapshotRedirectPath,
  resolveSnapshotRedirectDestination,
} from "@/lib/legacy-snapshot-redirect";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/**
 * Bundle guard for TB-1951–TB-1954 (TB-1955): showcase + tenant redirect matrix.
 * App Router integration: `snapshot/[runId]/page.test.tsx`.
 * Route metadata + docs drift: `legacy-snapshot-route.test.ts`.
 */
describe("legacy-snapshot redirect matrix (TB-1955)", () => {
  const matrix = [
    {
      label: "showcase static run id",
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      destination: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    },
    {
      label: "showcase alias run id",
      runId: "claims-intake-modernization-run",
      destination: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    },
    {
      label: "tenant run id",
      runId: "pilot-run-42",
      destination: "/architecture/reviews/pilot-run-42",
    },
  ] as const;

  it.each(matrix)("resolves $label to review workspace, never sponsor-report (TB-1952)", ({ runId, destination }) => {
    expect(resolveSnapshotRedirectDestination(runId)).toBe(destination);
    expect(resolveSnapshotRedirectDestination(runId)).not.toContain("/sponsor-report/");
  });

  it.each(matrix)("builds readOnly=1 redirect for $label (TB-1953)", ({ runId, destination }) => {
    expect(buildSnapshotRedirectPath(runId, {})).toBe(`${destination}?readOnly=1`);
  });

  it("preserves inbound query params on showcase leave-behind links (TB-1953)", () => {
    const target = buildSnapshotRedirectPath(SHOWCASE_STATIC_DEMO_RUN_ID, { v: "demo" });

    expect(target).toBe(`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}?readOnly=1&v=demo`);
  });
});
