import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import type { RunTrustEvidenceCard, TrustEvidenceFieldSnapshot } from "@/types/authority";

import { RunDetailEvidenceTabPanel } from "./RunDetailEvidenceTabPanel";

vi.mock("./run-detail-page-view-deferred-chunks", () => ({
  RunDetailCaptureEvidenceSectionDeferred: () => <div data-testid="capture-evidence" />,
  RunDetailTrustEvidenceCardSectionDeferred: () => <div data-testid="trust-evidence-section" />,
  RunDetailRetrievalGroundingSectionDeferred: () => null,
  RunDetailAdvancedAnalysisSectionDeferred: () => <section id="advanced-analysis">Advanced</section>,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: vi.fn(() => false),
}));

vi.mock("@/hooks/use-run-stored-evidence-catalog-query", () => ({
  useRunStoredEvidenceCatalogQuery: () => ({
    catalog: [],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/lib/runs/run-stored-evidence-file-api", () => ({
  downloadRunStoredEvidenceFile: vi.fn(),
  fetchRunStoredEvidenceFileBlob: vi.fn(),
}));

class IntersectionObserverMock {
  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}
}

vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: vi.fn(() => false),
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function field(title: string, status = "Available"): TrustEvidenceFieldSnapshot {
  return { title, status, detail: `${title} detail` };
}

function trustCard(): RunTrustEvidenceCard {
  return {
    selfAttestationNotice: "Operational evidence only.",
    executionMode: field("Execution mode"),
    goldenManifest: field("Golden manifest snapshot"),
    auditTrail: field("Audit trail"),
    agentTraces: field("Agent traces"),
    artifactBundlePointer: field("Persisted artifact bundle id"),
    traceabilityExport: field("Review-trail export"),
    aiExplainability: field("AI explanation citations", "Low confidence"),
    topFinding: {
      findingId: "finding-1",
      title: "Encrypt PHI stores",
      traceCompletenessLabel: "High",
      evidencePointersSummary: "Pointers resolved.",
    },
    links: [],
  };
}

describe("RunDetailEvidenceTabPanel", () => {
  it("renders section nav anchors and places trust evidence before deliverables", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RunDetailEvidenceTabPanel
        packageName="Payments platform"
        reviewDateLabel="9 Aug 2026"
        evidenceItemCount={0}
        deliverableCount={1}
        evidenceCoverageSummaryLine="1 of 1 open finding has linked evidence"
        linkedFindingCount={1}
        openFindingCount={1}
        items={[]}
        runId="run-abc"
        manifestId="manifest-1"
        buyerPolished={false}
        buyerPolishedArtifactTable={false}
        trustEvidenceCard={trustCard()}
        faithfulnessWarning={null}
        artifactsExportsSection={<section id="artifacts-exports">Deliverables</section>}
        blockingFindingId="finding-1"
        blockingFindingTitle="Encrypt PHI stores"
        approvalBlocked
      />
      </QueryClientProvider>,
    );

    const scopeSentence = screen.getByTestId("run-detail-evidence-tab-scope");
    expect(scopeSentence).toHaveTextContent("This list is the submitted evidence stored on the review.");
    const submittedEvidenceNav = screen.getByRole("link", { name: "Submitted evidence" });
    expect(scopeSentence.compareDocumentPosition(submittedEvidenceNav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(submittedEvidenceNav).toHaveAttribute("href", "#submitted-evidence-inventory");
    expect(screen.getByRole("link", { name: "Deliverables" })).toHaveAttribute("href", "#artifacts-exports");
    expect(screen.getByRole("link", { name: "Evidence basis" })).toHaveAttribute("href", "#trust-evidence");

    const trustIndex = container.innerHTML.indexOf('data-testid="trust-evidence-section"');
    const deliverablesIndex = container.innerHTML.indexOf('id="artifacts-exports"');

    expect(trustIndex).toBeGreaterThan(-1);
    expect(deliverablesIndex).toBeGreaterThan(trustIndex);
    expect(screen.getByText(/submitted source names were not stored/i)).toBeInTheDocument();
  });

  it("surfaces citations-without-source-names readiness when inventory rows exist (P-20)", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <RunDetailEvidenceTabPanel
          packageName="Payments platform"
          reviewDateLabel="9 Aug 2026"
          evidenceItemCount={1}
          deliverableCount={0}
          evidenceCoverageSummaryLine="1 of 1 open finding has linked evidence"
          linkedFindingCount={1}
          openFindingCount={1}
          items={[
            {
              key: "policy.pdf",
              sourceName: "policy.pdf",
              kind: "Evidence kind was not stored.",
              inventoryKind: "citation",
              evidenceItemId: null,
              ingestedUtc: null,
              citingFindingCount: 0,
              citingFindingCountStored: true,
            },
          ]}
          findingsCiteEvidenceWithoutSourceNames
          runId="run-abc"
          manifestId={null}
          buyerPolished={false}
          buyerPolishedArtifactTable={false}
          trustEvidenceCard={trustCard()}
          faithfulnessWarning={null}
          artifactsExportsSection={<section id="artifacts-exports">Deliverables</section>}
          blockingFindingId={null}
          blockingFindingTitle={null}
          approvalBlocked={false}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Findings cite evidence, but source names were not stored."),
    ).toBeInTheDocument();
  });
});
