import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: null }),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => false,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker-stub" />,
}));

vi.mock("@/lib/graph-api", () => ({
  getArchitectureGraph: vi.fn(),
  getDecisionSubgraph: vi.fn(),
  getNodeNeighborhood: vi.fn(),
  getProvenanceGraph: vi.fn(),
  mergeArchitectureGraphPages: vi.fn(),
}));

import { GraphPageContent } from "./GraphPageContent";
import {
  EVIDENCE_GRAPH_CLAIM_DISCIPLINE_HEADING,
  EVIDENCE_GRAPH_FOLLOW_UPS_TITLE,
} from "@/lib/evidence-graph-evidence-copy";
import {
  EVIDENCE_GRAPH_PAGE_SUBTITLE,
  EVIDENCE_GRAPH_PAGE_TITLE,
} from "@/lib/evidence-graph-page";
import {
  EVIDENCE_GRAPH_PRIMARY_CONTENT_ID,
  EVIDENCE_GRAPH_SKIP_LINK_LABEL,
} from "@/lib/evidence-graph-page-copy";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";

describe("GraphPageContent buyer-polished shell", () => {
  it("renders skip link, breadcrumb, orientation, and hides vocabulary rails", () => {
    render(<GraphPageContent />);

    const skipLink = screen.getByRole("link", { name: EVIDENCE_GRAPH_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${EVIDENCE_GRAPH_PRIMARY_CONTENT_ID}`);

    const breadcrumb = screen.getByTestId("evidence-graph-breadcrumb");
    expect(breadcrumb).toHaveTextContent(OPERATOR_NAV_GROUP_LABELS.analysis);
    expect(breadcrumb).toHaveTextContent(EVIDENCE_GRAPH_PAGE_TITLE);

    expect(screen.getByTestId("evidence-graph-page-title")).toHaveTextContent(EVIDENCE_GRAPH_PAGE_TITLE);
    expect(screen.getByText(EVIDENCE_GRAPH_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: EVIDENCE_GRAPH_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: EVIDENCE_GRAPH_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    expect(screen.queryByTestId("architecture-intelligence-evidence-graph-vocabulary")).toBeNull();
    expect(screen.queryByTestId("audit-evidence-trail-vocabulary")).toBeNull();
    expect(screen.queryByTestId("run-provenance-evidence-graph-vocabulary")).toBeNull();
    expect(screen.queryByTestId("package-evidence-evidence-graph-vocabulary")).toBeNull();
    expect(screen.queryByTestId("evidence-graph-first-open-coach")).toBeNull();

    const primaryContent = screen.getByTestId("evidence-graph-primary-content");
    const orientation = screen.getByTestId("evidence-graph-orientation-top");
    const controls = screen.getByTestId("graph-page-controls-buyer");

    expect(primaryContent).toContainElement(orientation);
    expect(controls.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
