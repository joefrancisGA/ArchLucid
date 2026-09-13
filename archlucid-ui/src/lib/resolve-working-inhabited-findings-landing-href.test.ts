import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import { resolveWorkingInhabitedFindingsLandingHref } from "@/lib/resolve-working-inhabited-findings-landing-href";

describe("resolveWorkingInhabitedFindingsLandingHref (IH-015 / ADR 0100)", () => {
  const architectureId = "architecture-identity-001";
  const runId = "run-abc";

  it("lands on nested findings when Working and ArchitectureId is known", () => {
    expect(
      resolveWorkingInhabitedFindingsLandingHref({
        runId,
        architectureId,
        workingMode: true,
      }),
    ).toBe(`${architectureNestedFindingsPath(architectureId)}?runId=${runId}`);
  });

  it("keeps peer review job URL when Working but architecture is unknown", () => {
    expect(
      resolveWorkingInhabitedFindingsLandingHref({
        runId,
        workingMode: true,
      }),
    ).toBe(`/architecture/reviews/${runId}`);
  });

  it("keeps peer review job URL when Guided even when architecture is known", () => {
    expect(
      resolveWorkingInhabitedFindingsLandingHref({
        runId,
        architectureId,
        workingMode: false,
      }),
    ).toBe(`/architecture/architectures/${architectureId}/reviews/${runId}`);
  });

  it("never routes to governance findings queue on Working", () => {
    const href = resolveWorkingInhabitedFindingsLandingHref({
      runId,
      architectureId,
      workingMode: true,
    });

    expect(href).not.toBe(`/governance/findings?runId=${runId}`);
    expect(href).not.toContain("/governance/findings");
  });
});
