import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProvenancePageWorkspace } from "@/components/provenance/ProvenancePageWorkspace";
import {
  PROVENANCE_CLAIM_DISCIPLINE,
  PROVENANCE_FOLLOW_UPS_TITLE,
  buildProvenanceSources,
} from "@/lib/provenance-evidence-copy";
import {
  PROVENANCE_BUYER_START_HERE_HELPER,
  PROVENANCE_FIRST_VIEWPORT_TEST_ID,
  PROVENANCE_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  PROVENANCE_PAGE_LEAD,
  PROVENANCE_PAGE_SUBTITLE_BUYER,
  PROVENANCE_PRIMARY_CONTENT_ID,
  PROVENANCE_SKIP_LINK_LABEL,
  PROVENANCE_SKIP_TARGET_ID,
  PROVENANCE_START_HERE_CARD_TITLE,
} from "@/lib/provenance-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => true,
  useProductionDeskChrome: (): boolean => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/demo-run/provenance",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/operator/OperatorDemoStaticBanner", () => ({
  OperatorDemoStaticBanner: () => <div data-testid="operator-demo-static-banner" />,
}));

vi.mock("./ProvenanceNextReviewFooterClient", () => ({
  ProvenanceNextReviewFooterClient: () => <div data-testid="provenance-next-review-footer-stub" />,
}));

vi.mock("@/components/runs/RunProvenanceEvidenceGraphVocabularyRail", () => ({
  RunProvenanceEvidenceGraphVocabularyRail: () => <div data-testid="run-provenance-evidence-graph-vocabulary" />,
}));

const graph: ArchitectureRunProvenanceGraph = {
  runId: "demo-run",
  traceabilityGaps: [],
  timeline: [
    {
      timestampUtc: "2026-01-01T12:00:00.000Z",
      kind: "manifestCommitted",
      label: "Manifest committed",
      referenceId: "m-1",
    },
  ],
  nodes: [
    { id: "n-ctx", type: "ContextSnapshot", referenceId: "ctx-1", name: "Source context reviewed" },
    { id: "n-find", type: "Finding", referenceId: "f-1", name: "PHI minimization risk" },
    { id: "n-manifest", type: "GoldenManifest", referenceId: "m-1", name: "Finalized review record" },
  ],
  edges: [
    { id: "e-1", type: "supports", fromNodeId: "n-ctx", toNodeId: "n-find" },
    { id: "e-2", type: "recorded in", fromNodeId: "n-find", toNodeId: "n-manifest" },
  ],
};

beforeEach(() => {
  globalThis.ResizeObserver = class {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(): void {
      this.callback(
        [
          {
            contentRect: {
              width: 960,
              height: 640,
              top: 0,
              left: 0,
              bottom: 640,
              right: 960,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            },
            target: document.body,
            intersectionRect: {} as DOMRectReadOnly,
            isIntersecting: true,
            boundingClientRect: {} as DOMRectReadOnly,
            rootBounds: null,
            intersectionRatio: 1,
            time: 0,
          },
        ],
        this as unknown as ResizeObserver,
      );
    }

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

describe("ProvenancePageWorkspace buyer-polished shell (RRP)", () => {
  it("renders skip link, intro, sources chrome, and hides operator mutations", async () => {
    render(<ProvenancePageWorkspace runId="demo-run" graph={graph} provenanceTraceId={null} />);

    expect(screen.getByRole("link", { name: PROVENANCE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PROVENANCE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("provenance-buyer-subtitle")).toHaveTextContent(PROVENANCE_PAGE_SUBTITLE_BUYER);
    expect(screen.getByTestId("provenance-intro")).toHaveTextContent(PROVENANCE_PAGE_LEAD);
    expect(screen.getByTestId("provenance-buyer-start-here-helper")).toHaveTextContent(
      PROVENANCE_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: PROVENANCE_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId(PROVENANCE_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      PROVENANCE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("provenance-wayfinding")).not.toBeInTheDocument();
    expect(screen.queryByTestId("provenance-run-scope-banner")).not.toBeInTheDocument();
    expect(screen.queryByText("Review identifier")).not.toBeInTheDocument();
    expect(screen.queryByTestId("run-provenance-evidence-graph-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("provenance-inspect-checklist")).not.toBeInTheDocument();
    expect(screen.queryByTestId("provenance-next-review-footer-stub")).not.toBeInTheDocument();
    expect(screen.queryByTestId("provenance-section-nav-desktop")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Search review evidence" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: PROVENANCE_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("provenance-graph-viewport")).toBeInTheDocument();
    });

    const primaryContent = screen.getByTestId(PROVENANCE_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(PROVENANCE_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("provenance-orientation-bottom");
    const sourcesSection = screen.getByTestId("provenance-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(buildProvenanceSources("demo-run"))) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
