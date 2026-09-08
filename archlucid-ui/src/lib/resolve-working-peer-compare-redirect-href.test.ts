import { describe, expect, it } from "vitest";

import {
  architectureNestedComparePath,
  architectureNestedGraphPath,
} from "@/lib/architecture/architecture-routes";
import { resolveWorkingPeerCompareRedirectHref } from "@/lib/resolve-working-peer-compare-redirect-href";
import { resolveWorkingPeerGraphRedirectHref } from "@/lib/resolve-working-peer-graph-redirect-href";

describe("resolveWorkingPeerCompareRedirectHref (SY-39 / ADR 0079)", () => {
  const architectureId = "architecture-identity-001";

  it("redirects peer Compare to nested Compare with run pair preserved", () => {
    expect(
      resolveWorkingPeerCompareRedirectHref({
        pathname: "/insights/compare-two-reviews",
        search: "?priorRunId=run-prior&laterRunId=run-later",
        lastOpenArchitectureId: architectureId,
      }),
    ).toBe(
      `${architectureNestedComparePath(architectureId)}?leftRunId=run-prior&rightRunId=run-later`,
    );
  });

  it("falls back to portfolio when no architecture is known", () => {
    expect(
      resolveWorkingPeerCompareRedirectHref({
        pathname: "/insights/compare-two-reviews",
      }),
    ).toBe("/architecture/architectures");
  });
});

describe("resolveWorkingPeerGraphRedirectHref (SY-41 / ADR 0079)", () => {
  const architectureId = "architecture-identity-001";

  it("redirects peer graph to nested graph with query preserved", () => {
    expect(
      resolveWorkingPeerGraphRedirectHref({
        pathname: "/insights/evidence-graph",
        search: "?runId=run-1",
        lastOpenArchitectureId: architectureId,
      }),
    ).toBe(`${architectureNestedGraphPath(architectureId)}?runId=run-1`);
  });

  it("falls back to portfolio when no architecture is known", () => {
    expect(
      resolveWorkingPeerGraphRedirectHref({
        pathname: "/insights/evidence-graph",
      }),
    ).toBe("/architecture/architectures");
  });

  it("returns null for non-peer paths", () => {
    expect(
      resolveWorkingPeerGraphRedirectHref({
        pathname: "/architecture/architectures/architecture-identity-001/graph",
        lastOpenArchitectureId: "architecture-identity-001",
      }),
    ).toBeNull();
  });
});
