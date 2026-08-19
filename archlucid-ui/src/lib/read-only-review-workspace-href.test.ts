import { describe, expect, it } from "vitest";

import {
  buildReadOnlyReviewWorkspaceHref,
  resolveReadOnlyReviewWorkspacePath,
} from "@/lib/read-only-review-workspace-href";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("read-only-review-workspace-href", () => {
  const matrix = [
    {
      label: "showcase static run id",
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      destination: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    },
    {
      label: "showcase alias run id",
      runId: "customer-intake-modernization-run",
      destination: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    },
    {
      label: "tenant run id",
      runId: "pilot-run-42",
      destination: "/architecture/reviews/pilot-run-42",
    },
  ] as const;

  it.each(matrix)("resolves $label to review workspace, never sponsor-report", ({ runId, destination }) => {
    expect(resolveReadOnlyReviewWorkspacePath(runId)).toBe(destination);
    expect(resolveReadOnlyReviewWorkspacePath(runId)).not.toContain("/sponsor-report/");
  });

  it.each(matrix)("builds readOnly=1 href for $label", ({ runId, destination }) => {
    expect(buildReadOnlyReviewWorkspaceHref(runId, {})).toBe(`${destination}?readOnly=1`);
  });

  it("preserves inbound query params on showcase leave-behind links", () => {
    expect(buildReadOnlyReviewWorkspaceHref(SHOWCASE_STATIC_DEMO_RUN_ID, { v: "demo" })).toBe(
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}?readOnly=1&v=demo`,
    );
  });
});
