import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  PACKAGE_PRINT_REHEARSAL_CAREER_DOOR_BODY,
  PACKAGE_PRINT_REHEARSAL_STRIP_TITLE,
} from "@/lib/package-print-rehearsal-honesty";
import { buildPackagePrintPresentation } from "@/lib/package-print-view";
import type { RunSummary } from "@/types/authority";

import { PackagePrintPageView } from "./PackagePrintPageView";

vi.mock("@/hooks/use-working-back-locator", () => ({
  useWorkingBackLocator: () => ({ reviewJobHref: "/architecture/reviews/run-print-1?reviewTab=review-package" }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => false,
}));

function summary(): RunSummary {
  return {
    runId: "run-print-1",
    projectId: "project-1",
    createdUtc: "2026-08-01T12:00:00Z",
    description: "Payments edge",
    displayName: "Payments edge",
    hasGoldenManifest: true,
    findingCount: 2,
    warningCount: 0,
    structuralExecutionMode: "Simulator",
    workingCareerRehearsalDoor: "career",
  } as RunSummary;
}

describe("PackagePrintPageView (CG-023)", () => {
  it("renders print-only rehearsal honesty strip for simulator runs", () => {
    const presentation = buildPackagePrintPresentation(summary(), {
      rehearsalHonestyStrip: {
        title: PACKAGE_PRINT_REHEARSAL_STRIP_TITLE,
        body: PACKAGE_PRINT_REHEARSAL_CAREER_DOOR_BODY,
        modeNoticeTitle: "Simulator AI operation",
        modeNoticeBody: "Rule-based analysis only — not live AI output.",
      },
    });

    render(<PackagePrintPageView presentation={presentation} />);

    const strip = screen.getByTestId("package-print-rehearsal-honesty-strip");

    expect(strip).toBeInTheDocument();
    expect(strip).toHaveClass("hidden");
    expect(strip).toHaveClass("print:block");
    expect(screen.getByTestId("package-print-rehearsal-honesty-title")).toHaveTextContent(
      PACKAGE_PRINT_REHEARSAL_STRIP_TITLE,
    );
    expect(screen.getByTestId("package-print-rehearsal-honesty-title")).toHaveTextContent(/Rehearsal/i);
  });
});
