import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/api", () => ({
  getTenantMeasuredRoi: vi.fn(),
  getSponsorEvidencePack: vi.fn(),
  getFirstValueReportMarkdown: vi.fn(),
  getRunExplanationSummary: vi.fn(),
}));

import {
  getFirstValueReportMarkdown,
  getRunExplanationSummary,
  getSponsorEvidencePack,
  getTenantMeasuredRoi,
  type SponsorEvidencePackPayload,
} from "@/lib/api";

import { WhyArchLucidPage } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidPage";
import { WHY_ARCHLUCID_CLAIM_DISCIPLINE, WHY_ARCHLUCID_CLAIM_HEADING } from "@/lib/why-archlucid-evidence-copy";
import {
  WHY_ARCHLUCID_PAGE_ORIENTATION_BUYER,
  WHY_ARCHLUCID_PAGE_ORIENTATION_OPERATOR,
  WHY_ARCHLUCID_PAGE_TITLE,
  whyArchLucidPageOrientation,
} from "@/lib/why-archlucid-page-copy";

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
  monthlyCostEstimate: null,
  disclaimer: "Process counters are cumulative since this API replica started.",
};

const fixedSponsorEvidencePack: SponsorEvidencePackPayload = {
  generatedUtc: "2026-04-28T01:02:03.456Z",
  demoRunId: fixedSnapshot.demoRunId,
  processInstrumentation: fixedSnapshot,
  explainabilityTrace: null,
  demoRunValueReportDelta: {
    runCreatedUtc: "2026-04-01T10:11:12.000Z",
    timeToCommittedManifestTotalSeconds: 812.25,
    manifestCommittedUtc: "2026-04-01T10:24:44.250Z",
    findingsBySeverity: [],
    auditRowCount: 5,
    auditRowCountTruncated: false,
    llmCallCount: 3,
    topFindingSeverity: "High",
    topFindingId: "f-1",
    topFindingEvidenceChain: null,
    isDemoTenant: true,
  },
  governanceOutcomes: null,
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
  themeSummaries: ["Theme A"],
  overallAssessment: "Healthy baseline.",
  riskPosture: "Moderate",
  findingCount: 6,
  decisionCount: 4,
  unresolvedIssueCount: 1,
  complianceGapCount: 0,
  citations: [{ kind: "Manifest" as const, id: "m-1", label: "contoso-baseline-v1" }],
};

describe("WhyArchLucidPage buyer-polished shell", () => {
  it("uses breadcrumb, help, claim orientation strip, and page chrome", async () => {
    measuredRoiMock.mockResolvedValue(fixedMeasuredRoi);
    sponsorPackMock.mockResolvedValue(fixedSponsorEvidencePack);
    reportMock.mockResolvedValue(fixedReport);
    explanationMock.mockResolvedValue(fixedExplanation);

    render(<WhyArchLucidPage />);

    await waitFor(() => {
      expect(screen.getByTestId("why-archlucid-counters")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { level: 1, name: WHY_ARCHLUCID_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(WHY_ARCHLUCID_PAGE_ORIENTATION_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(WHY_ARCHLUCID_PAGE_ORIENTATION_OPERATOR)).not.toBeInTheDocument();
    expect(screen.queryByTestId("why-archlucid-marketing-disambiguation")).toBeNull();
    expect(screen.getByTestId("why-archlucid-page-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("why-archlucid-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(WHY_ARCHLUCID_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(WHY_ARCHLUCID_CLAIM_DISCIPLINE)).toBeInTheDocument();
  });
});
