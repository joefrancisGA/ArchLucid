import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import { getFindingDetailHref } from "@/lib/findings/finding-evidence-navigation";

import { resolveGovernanceQueueAuxiliaryFindingHref } from "./governance-findings-navigation";

describe("resolveGovernanceQueueAuxiliaryFindingHref (WA-001)", () => {
  it("lands on nested focusedFinding when Working architecture is known", () => {
    const href = resolveGovernanceQueueAuxiliaryFindingHref("run-1", "finding-1", {
      inspectHrefOptions: {
        architectureId: "arch-1",
        isWorkingMode: true,
      },
    });

    expect(href).toBe(
      `${architectureNestedFindingsPath("arch-1")}?runId=run-1&focusedFinding=finding-1`,
    );
  });

  it("preserves peer finding detail when architecture is unknown", () => {
    const href = resolveGovernanceQueueAuxiliaryFindingHref("run-1", "finding-1", {
      findingsQueueRunId: "run-queue-scope",
    });

    expect(href).toBe(getFindingDetailHref("run-1", "finding-1", "run-queue-scope"));
  });

  it("uses peer inspect route for assigned-to-me fallback", () => {
    const href = resolveGovernanceQueueAuxiliaryFindingHref("run-1", "finding-1", {
      usePeerInspectRoute: true,
    });

    expect(href).toBe("/architecture/reviews/run-1/findings/finding-1/evidence-trace");
  });
});
