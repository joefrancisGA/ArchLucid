import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ReviewPackageSponsorHandoffStrip } from "./ReviewPackageSponsorHandoffStrip";

vi.mock("@/components/GoldenManifestExportMenu", () => ({
  GoldenManifestExportMenu: () => (
    <button type="button" data-testid="review-package-sponsor-handoff-markdown-download">
      Download review summary
    </button>
  ),
}));

vi.mock("@/components/SponsorRoiBaselineGateNotice", () => ({
  SponsorRoiBaselineGateNotice: ({ isFinalized }: { isFinalized: boolean }) =>
    isFinalized ? <div data-testid="sponsor-roi-baseline-gate-notice">ROI baselines not captured</div> : null,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("ReviewPackageSponsorHandoffStrip", () => {
  it("surfaces sponsor export controls in the first-viewport handoff strip", () => {
    render(
      <ReviewPackageSponsorHandoffStrip
        runId="run-abc"
        manifestId="manifest-1"
        goldenManifestJsonForExport={{}}
        manifestSummary={null}
        trustEvidenceCard={null}
        usedStaticDemoRun={false}
        showExtendedSponsorBriefing
      />,
    );

    expect(screen.getByTestId("review-package-sponsor-handoff-strip")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Send to sponsor" })).toBeInTheDocument();
    expect(screen.getByText(/Download the executive review summary or architecture report/)).toBeInTheDocument();
    expect(screen.getByTestId("review-package-sponsor-handoff-docx")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-sponsor-handoff-more-exports")).toBeInTheDocument();
  });

  it("reveals markdown export and rehearsal controls inside more exports", () => {
    render(
      <ReviewPackageSponsorHandoffStrip
        runId="run-abc"
        manifestId="manifest-1"
        goldenManifestJsonForExport={{}}
        manifestSummary={null}
        trustEvidenceCard={null}
        usedStaticDemoRun={false}
        showExtendedSponsorBriefing
      />,
    );

    fireEvent.click(screen.getByText("More sponsor exports"));

    expect(screen.getByTestId("review-package-sponsor-handoff-markdown-download")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-rehearsal-preview")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-sponsor-handoff-more")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc?reviewTab=review-package#sponsor-handoff-extended",
    );
  });

  it("mounts the soft ROI baseline gate notice near sponsor export CTAs", () => {
    render(
      <ReviewPackageSponsorHandoffStrip
        runId="run-abc"
        manifestId="manifest-1"
        goldenManifestJsonForExport={{}}
        manifestSummary={null}
        trustEvidenceCard={null}
        usedStaticDemoRun={false}
        showExtendedSponsorBriefing={false}
      />,
    );

    expect(screen.getByTestId("sponsor-roi-baseline-gate-notice")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-sponsor-handoff-docx")).not.toBeDisabled();
  });
});
