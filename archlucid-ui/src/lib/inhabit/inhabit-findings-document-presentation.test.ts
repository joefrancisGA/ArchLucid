import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import {
  INHABIT_WORKING_NESTED_FINDINGS_EMPTY_TITLE,
  resolveInhabitedFindingsDocumentPresentation,
  resolveInhabitedFindingsEmptyStateCopy,
  resolveIsInhabitedFindingsDocument,
} from "@/lib/inhabit/inhabit-findings-document-presentation";

describe("inhabit findings document presentation (IH-016 / IH-021 / IH-023)", () => {
  const architectureId = "architecture-identity-001";
  const nestedPath = architectureNestedFindingsPath(architectureId);

  it("detects Working nested findings as inhabited document", () => {
    expect(
      resolveIsInhabitedFindingsDocument({
        workingMode: true,
        pathname: nestedPath,
        scopedArchitectureId: architectureId,
      }),
    ).toBe(true);
  });

  it("uses architecture display name as H1 and job subtitle for scoped run", () => {
    const presentation = resolveInhabitedFindingsDocumentPresentation({
      workingMode: true,
      pathname: nestedPath,
      scopedArchitectureId: architectureId,
      architectureDisplayName: "Payments platform",
      scopedRunId: "run-child-1",
      scopedRunTitle: "September review",
    });

    expect(presentation?.pageTitle).toBe("Payments platform");
    expect(presentation?.jobSubtitle).toBe("Child review: September review");
    expect(presentation?.suppressPipelineChrome).toBe(true);
  });

  it("returns quiet-engine empty copy on inhabited nested findings", () => {
    const empty = resolveInhabitedFindingsEmptyStateCopy({
      workingMode: true,
      pathname: nestedPath,
      scopedArchitectureId: architectureId,
      architectureDisplayName: "Payments platform",
      scopedRunId: "run-child-1",
      scopedRunTitle: null,
    });

    expect(empty?.title).toBe(INHABIT_WORKING_NESTED_FINDINGS_EMPTY_TITLE);
    expect(empty?.description).toMatch(/quiet engines/i);
  });

  it("does not apply on Guided mode", () => {
    expect(
      resolveInhabitedFindingsDocumentPresentation({
        workingMode: false,
        pathname: nestedPath,
        scopedArchitectureId: architectureId,
        architectureDisplayName: "Payments platform",
      }),
    ).toBeNull();
  });

  it("does not inhabit SecureNow compliance findings even with architecture scope", () => {
    expect(
      resolveIsInhabitedFindingsDocument({
        workingMode: true,
        pathname: "/compliance/findings",
        scopedArchitectureId: architectureId,
        productLineId: "security",
      }),
    ).toBe(false);
    expect(
      resolveInhabitedFindingsDocumentPresentation({
        workingMode: true,
        pathname: "/compliance/findings",
        scopedArchitectureId: architectureId,
        architectureDisplayName: "Customer intake",
        productLineId: "security",
      }),
    ).toBeNull();
  });
});
