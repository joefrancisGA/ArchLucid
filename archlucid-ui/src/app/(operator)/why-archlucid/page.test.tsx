import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  getTenantMeasuredRoi: vi.fn(),
  getSponsorEvidencePack: vi.fn(),
  getFirstValueReportMarkdown: vi.fn(),
  getRunExplanationSummary: vi.fn(),
}));

vi.mock("@/components/OperatorApiProblem", () => ({
  OperatorApiProblem: ({ fallbackMessage }: { fallbackMessage: string }) => (
    <div data-testid="api-problem-mock">{fallbackMessage}</div>
  ),
}));

import {
  getFirstValueReportMarkdown,
  getRunExplanationSummary,
  getSponsorEvidencePack,
  getTenantMeasuredRoi,
  type SponsorEvidencePackPayload,
} from "@/lib/api";

import WhyArchLucidPage from "./page";
import { WHY_ARCHLUCID_MARKETING_WHY_HREF, WHY_ARCHLUCID_PAGE_TITLE } from "@/lib/why-archlucid-page-copy";

const measuredRoiMock = vi.mocked(getTenantMeasuredRoi);
const sponsorPackMock = vi.mocked(getSponsorEvidencePack);
const reportMock = vi.mocked(getFirstValueReportMarkdown);
const explanationMock = vi.mocked(getRunExplanationSummary);

const fixedSnapshot = {
  generatedUtc: "2026-04-20T12:00:00.000Z",
  demoRunId: "6e8c4a102b1f4c9a9d3e10b2a4f0c501",
  runsCreatedTotal: 7,
  findingsProducedBySeverity: { Critical: 1, High: 2, Medium: 3 },
  auditRowCount: 12,
  auditRowCountTruncated: false,
};

const fixedMeasuredRoi = {
  snapshot: fixedSnapshot,
  monthlyCostEstimate: {
    currency: "USD",
    tier: "Standard",
    estimatedMonthlyUsdLow: 10,
    estimatedMonthlyUsdHigh: 50,
    factors: ["tier"],
    methodologyNote: "method",
  },
  disclaimer: "Process counters are cumulative since this API replica started.",
};

const fixedSponsorEvidencePack: SponsorEvidencePackPayload = {
  generatedUtc: "2026-04-28T01:02:03.456Z",
  demoRunId: fixedSnapshot.demoRunId,
  processInstrumentation: fixedSnapshot,
  explainabilityTrace: {
    totalFindings: 2,
    overallCompletenessRatio: 0.42,
    byEngine: [
      {
        engineType: "ArchitecturalDebt",
        findingCount: 2,
        completenessRatio: 0.42,
        graphNodeIdsPopulatedCount: 1,
        rulesAppliedPopulatedCount: 0,
        decisionsTakenPopulatedCount: 0,
        alternativePathsPopulatedCount: 0,
        notesPopulatedCount: 2,
      },
    ],
  },
  demoRunValueReportDelta: {
    runCreatedUtc: "2026-04-01T10:11:12.000Z",
    timeToCommittedManifestTotalSeconds: 812.25,
    manifestCommittedUtc: "2026-04-01T10:24:44.250Z",
    findingsBySeverity: [
      { severity: "High", count: 1 },
      { severity: "Medium", count: 2 },
    ],
    auditRowCount: 5,
    auditRowCountTruncated: false,
    llmCallCount: 3,
    topFindingSeverity: "High",
    topFindingId: "f-1",
    topFindingEvidenceChain: null,
    isDemoTenant: true,
  },
  governanceOutcomes: {
    pendingApprovalCount: 0,
    recentTerminalDecisionCount: 1,
    recentPolicyPackChangeCount: 0,
  },
};
const fixedReport = `# ArchLucid — first value report (pilot)\n\nDemo body.`;

const fixedExplanation = {
  explanation: {
    rawText: "raw",
    structured: null,
    confidence: null,
    provenance: null,
    summary: "Summary",
    keyDrivers: [],
    riskImplications: [],
    costImplications: [],
    complianceImplications: [],
    detailedNarrative: "Narrative.",
  },
  themeSummaries: ["Theme A", "Theme B"],
  overallAssessment: "Healthy baseline with two open mediums.",
  riskPosture: "Moderate",
  findingCount: 6,
  decisionCount: 4,
  unresolvedIssueCount: 1,
  complianceGapCount: 0,
  citations: [
    { kind: "Manifest" as const, id: "m-1", label: "contoso-baseline-v1" },
    { kind: "Finding" as const, id: "f-1", label: "Public storage" },
  ],
};

describe("WhyArchLucidPage (proof page snapshot)", () => {
  it("matches the rendered layout snapshot for the demo tenant", async () => {
    measuredRoiMock.mockResolvedValue(fixedMeasuredRoi);
    sponsorPackMock.mockResolvedValue(fixedSponsorEvidencePack);
    reportMock.mockResolvedValue(fixedReport);
    explanationMock.mockResolvedValue(fixedExplanation);

    const { container } = render(<WhyArchLucidPage />);

    await waitFor(() => {
      expect(screen.getByTestId("why-archlucid-counters")).toBeInTheDocument();
      expect(screen.getByTestId("why-archlucid-first-value-report-body")).toHaveTextContent(
        "ArchLucid — first value report",
      );
      expect(screen.getByTestId("why-archlucid-citations")).toHaveTextContent("Signed review record");
    });

    expect(container.firstChild).toMatchSnapshot();
  });

  it("labels Contoso seed chrome without Claims Intake (TB-1306)", async () => {
    measuredRoiMock.mockResolvedValue(fixedMeasuredRoi);
    sponsorPackMock.mockResolvedValue(fixedSponsorEvidencePack);
    reportMock.mockResolvedValue(fixedReport);
    explanationMock.mockResolvedValue(fixedExplanation);

    render(<WhyArchLucidPage />);

    await waitFor(() => {
      expect(screen.getByTestId("why-archlucid-universe-banner")).toHaveAttribute(
        "data-why-archlucid-universe",
        "contoso",
      );
    });

    expect(screen.getByTestId("why-archlucid-universe-banner")).toHaveAttribute(
      "data-why-archlucid-universe-fail-closed",
      "false",
    );
    expect(screen.getByTestId("why-archlucid-universe-banner-title")).toHaveTextContent(/Retail baseline/i);
    expect(screen.getByTestId("why-archlucid-universe-lead")).toHaveTextContent(/Retail baseline/i);
    expect(screen.getByTestId("why-archlucid-universe-lead")).not.toHaveTextContent(/Claims Intake/i);
    expect(screen.getByTestId("why-archlucid-sponsor-pack-source")).toHaveTextContent(/Retail baseline/i);
    expect(screen.getByTestId("why-archlucid-sponsor-pack-source")).not.toHaveTextContent(/Claims Intake/i);
  });

  it("fails closed when Claims and Contoso signals collide (TB-1306)", async () => {
    measuredRoiMock.mockResolvedValue({
      ...fixedMeasuredRoi,
      snapshot: {
        ...fixedSnapshot,
        demoRunId: "claims-intake-modernization",
      },
    });
    sponsorPackMock.mockResolvedValue({
      ...fixedSponsorEvidencePack,
      demoRunId: "claims-intake-modernization",
      demoRunValueReportDelta: {
        ...fixedSponsorEvidencePack.demoRunValueReportDelta!,
        isDemoTenant: true,
      },
    });
    reportMock.mockResolvedValue(fixedReport);
    explanationMock.mockResolvedValue(fixedExplanation);

    render(<WhyArchLucidPage />);

    await waitFor(() => {
      expect(screen.getByTestId("why-archlucid-universe-banner")).toHaveAttribute(
        "data-why-archlucid-universe",
        "unknown",
      );
    });

    expect(screen.getByTestId("why-archlucid-universe-banner")).toHaveAttribute(
      "data-why-archlucid-universe-fail-closed",
      "true",
    );
    expect(screen.getByTestId("why-archlucid-universe-lead")).not.toHaveTextContent(/Claims Intake/i);
    expect(screen.getByTestId("why-archlucid-sponsor-pack-source")).not.toHaveTextContent(/Claims Intake/i);
    expect(screen.getByTestId("why-archlucid-sponsor-pack-source")).not.toHaveTextContent(/Retail baseline/i);
  });

  it("TB-1308: purges engineering metric hints and repo doc footer paths", async () => {
    measuredRoiMock.mockResolvedValue(fixedMeasuredRoi);
    sponsorPackMock.mockResolvedValue(fixedSponsorEvidencePack);
    reportMock.mockResolvedValue(fixedReport);
    explanationMock.mockResolvedValue(fixedExplanation);

    render(<WhyArchLucidPage />);

    await waitFor(() => {
      expect(screen.getByTestId("why-archlucid-counters")).toBeInTheDocument();
    });

    const pageText = document.body.textContent ?? "";
    expect(pageText).not.toMatch(/ArchLucidInstrumentation/i);
    expect(pageText).not.toMatch(/IAuditRepository/i);
    expect(pageText).not.toMatch(/archlucid_runs_created_total/i);
    expect(pageText).not.toMatch(/docs\/library\/SPONSOR_ONE_PAGER\.md/i);
    expect(pageText).not.toMatch(/docs\/go-to-market\/POSITIONING\.md/i);

    expect(screen.getByTestId("why-archlucid-page-footer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Executive sponsor brief/i })).toHaveAttribute(
      "href",
      "/help/executive-summary",
    );
    expect(screen.getByRole("link", { name: /Getting started/i })).toHaveAttribute("href", "/get-started");
    expect(screen.getByRole("link", { name: /Trust Center/i })).toHaveAttribute("href", "/trust");
  });

  it("TB-1307: disambiguates operator proof telemetry from marketing /why", async () => {
    measuredRoiMock.mockResolvedValue(fixedMeasuredRoi);
    sponsorPackMock.mockResolvedValue(fixedSponsorEvidencePack);
    reportMock.mockResolvedValue(fixedReport);
    explanationMock.mockResolvedValue(fixedExplanation);

    render(<WhyArchLucidPage />);

    await waitFor(() => {
      expect(screen.getByTestId("why-archlucid-counters")).toBeInTheDocument();
    });

    expect(screen.getByTestId("why-archlucid-page-title")).toHaveTextContent(WHY_ARCHLUCID_PAGE_TITLE);
    expect(screen.getByTestId("why-archlucid-page-title")).not.toHaveTextContent(/^Why ArchLucid$/);
    expect(screen.getByTestId("why-archlucid-marketing-disambiguation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Public differentiation/i })).toHaveAttribute(
      "href",
      WHY_ARCHLUCID_MARKETING_WHY_HREF,
    );
  });

  it("TB-1309: primary CTA deep-links the demo run when snapshot loads", async () => {
    measuredRoiMock.mockResolvedValue(fixedMeasuredRoi);
    sponsorPackMock.mockResolvedValue(fixedSponsorEvidencePack);
    reportMock.mockResolvedValue(fixedReport);
    explanationMock.mockResolvedValue(fixedExplanation);

    render(<WhyArchLucidPage />);

    await waitFor(() => {
      expect(screen.getByTestId("why-archlucid-primary-cta")).toBeInTheDocument();
    });

    expect(screen.getByTestId("why-archlucid-primary-cta")).toHaveAttribute(
      "href",
      `/architecture/reviews/${fixedSnapshot.demoRunId}`,
    );
  });

  it("TB-1309: withholds primary CTA when demo identity is fail-closed", async () => {
    measuredRoiMock.mockResolvedValue({
      ...fixedMeasuredRoi,
      snapshot: {
        ...fixedSnapshot,
        demoRunId: "claims-intake-modernization",
      },
    });
    sponsorPackMock.mockResolvedValue({
      ...fixedSponsorEvidencePack,
      demoRunId: "claims-intake-modernization",
      demoRunValueReportDelta: {
        ...fixedSponsorEvidencePack.demoRunValueReportDelta!,
        isDemoTenant: true,
      },
    });
    reportMock.mockResolvedValue(fixedReport);
    explanationMock.mockResolvedValue(fixedExplanation);

    render(<WhyArchLucidPage />);

    await waitFor(() => {
      expect(screen.getByTestId("why-archlucid-universe-banner")).toHaveAttribute(
        "data-why-archlucid-universe",
        "unknown",
      );
    });

    expect(screen.queryByTestId("why-archlucid-primary-cta")).not.toBeInTheDocument();
  });

  it("TB-1310: renders operator PageHeading chrome with breadcrumb and contextual help", async () => {
    measuredRoiMock.mockResolvedValue(fixedMeasuredRoi);
    sponsorPackMock.mockResolvedValue(fixedSponsorEvidencePack);
    reportMock.mockResolvedValue(fixedReport);
    explanationMock.mockResolvedValue(fixedExplanation);

    render(<WhyArchLucidPage />);

    await waitFor(() => {
      expect(screen.getByTestId("why-archlucid-counters")).toBeInTheDocument();
    });

    expect(screen.getByTestId("why-archlucid-page-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("why-archlucid-page-heading-actions")).toBeInTheDocument();
    expect(screen.getByTestId("why-archlucid-internal-pilot-badge")).toHaveTextContent(/Internal pilot proof/i);
    expect(document.querySelector('[data-nav-href="/why-archlucid"]')).toBeInTheDocument();
  });

  it("shows API-problem callouts when downstream calls fail", async () => {
    measuredRoiMock.mockRejectedValue(new Error("snapshot failed"));
    sponsorPackMock.mockRejectedValue(new Error("pack failed"));
    reportMock.mockRejectedValue(new Error("report failed"));
    explanationMock.mockRejectedValue(new Error("explain failed"));

    render(<WhyArchLucidPage />);

    await waitFor(() => {
      const problems = screen.getAllByTestId("api-problem-mock");
      expect(problems.some((p) => p.textContent?.includes("snapshot failed"))).toBe(true);
    });
  });
});
