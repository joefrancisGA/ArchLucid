import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PackagePrintPageView } from "./PackagePrintPageView";
import {
  PACKAGE_PRINT_FINDINGS_HEADING,
  PACKAGE_PRINT_PAGE_TITLE,
  PACKAGE_PRINT_STATUS_HEADING,
  PACKAGE_PRINT_SYNOPSIS_HEADING,
} from "@/lib/package-print-view";

vi.mock("./PackagePrintNextReviewFooterClient", () => ({
  PackagePrintNextReviewFooterClient: () => <div data-testid="package-print-next-review-footer-stub" />,
}));

describe("PackagePrintPageView (TB-2205)", () => {
  it("renders title, status, findings, and sponsor synopsis", () => {
    render(
      <PackagePrintPageView
        presentation={{
          title: "Payments edge",
          statusLabel: "Finalized",
          statusKind: "approved",
          findingsSummary: "3 findings · 1 warning. Included in the finalized architecture review.",
          sponsorSynopsis: 'Sponsor synopsis for "Payments edge": finalized architecture review with 3 findings recorded.',
          createdUtc: "2026-08-01T12:00:00Z",
          runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          manifestVersionForGuard: "manifest-1",
        }}
      />,
    );

    expect(screen.getByTestId("package-print-page")).toBeInTheDocument();
    expect(screen.getByTestId("package-print-title")).toHaveTextContent("Payments edge");
    expect(screen.getByText(PACKAGE_PRINT_PAGE_TITLE)).toBeInTheDocument();
    expect(screen.getByText(PACKAGE_PRINT_STATUS_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId("package-print-status")).toHaveTextContent("Finalized");
    expect(screen.getByText(PACKAGE_PRINT_FINDINGS_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId("package-print-findings-summary")).toHaveTextContent("3 findings");
    expect(screen.getByText(PACKAGE_PRINT_SYNOPSIS_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId("package-print-sponsor-synopsis")).toHaveTextContent("Sponsor synopsis");
    expect(screen.getByTestId("package-print-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("package-print-back")).toHaveAttribute(
      "href",
      "/architecture/reviews/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa?tab=review-package",
    );
  });

  it("omits synopsis section when null", () => {
    render(
      <PackagePrintPageView
        presentation={{
          title: "Draft review",
          statusLabel: "Draft",
          statusKind: "draft",
          findingsSummary: "No findings summary is available yet.",
          sponsorSynopsis: null,
          createdUtc: "2026-08-01T12:00:00Z",
          runId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        }}
      />,
    );

    expect(screen.queryByTestId("package-print-sponsor-synopsis")).toBeNull();
  });
});
