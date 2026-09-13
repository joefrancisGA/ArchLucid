import { describe, expect, it } from "vitest";

import { resolveGovernanceFindingsQueueHeaderNavHref } from "@/lib/governance/resolve-governance-findings-queue-header-nav-href";

describe("resolveGovernanceFindingsQueueHeaderNavHref (SG-030 / ADR 0098)", () => {
  it("returns architecture desk when findings queue is nested under an architecture", () => {
    expect(
      resolveGovernanceFindingsQueueHeaderNavHref({
        isAssignedToMe: false,
        workingMode: true,
        pathname: "/architecture/architectures/architecture-identity-001/findings?runId=run-1",
      }),
    ).toBe("/architecture/architectures/architecture-identity-001");
    expect(
      resolveGovernanceFindingsQueueHeaderNavHref({
        isAssignedToMe: false,
        workingMode: true,
        pathname: "/architecture/architectures/architecture-identity-001/findings?runId=run-1",
      }),
    ).not.toBe("/governance/findings");
  });

  it("returns scoped architecture desk in Working mode when architecture filter is active", () => {
    expect(
      resolveGovernanceFindingsQueueHeaderNavHref({
        isAssignedToMe: false,
        workingMode: true,
        scopedArchitectureId: "architecture-identity-001",
        pathname: "/governance/findings?architectureId=architecture-identity-001",
      }),
    ).toBe("/architecture/architectures/architecture-identity-001");
  });

  it("keeps platform findings hub when Working mode has no architecture scope", () => {
    expect(
      resolveGovernanceFindingsQueueHeaderNavHref({
        isAssignedToMe: false,
        workingMode: true,
        pathname: "/governance/findings",
      }),
    ).toBe("/governance/findings");
  });
});
