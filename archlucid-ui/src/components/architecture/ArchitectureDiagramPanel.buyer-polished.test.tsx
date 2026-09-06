import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/components/architecture/ArchitectureDiagramViewer", () => ({
  ArchitectureDiagramViewer: () => <div data-testid="architecture-diagram-viewer-mock" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
  };
});

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

import { ArchitectureDiagramPanel } from "@/components/architecture/ArchitectureDiagramPanel";
import { ARCHITECTURE_DIAGRAM_CLARIFY_ARCHITECTURE_ACTION } from "@/lib/architecture/architecture-diagram-copy";
import {
  ARCHITECTURE_CREATED_DIAGRAM_BUYER_INSUFFICIENT_BODY,
  ARCHITECTURE_CREATED_DIAGRAM_BUYER_START_HERE_HELPER,
  ARCHITECTURE_CREATED_DIAGRAM_PAGE_LEAD,
} from "@/lib/architecture/architecture-created-diagram-sources";
import { ARCHITECTURE_CREATED_DIAGRAM_SKIP_TARGET_ID } from "@/lib/architecture/architecture-created-diagram-page-copy";

const sufficientSource = `## Systems and services
- Claims API
## Users and stakeholders
- Claims analyst
## Data flows
Claims analyst -> Claims API`;

const assertions = {
  architectureName: "Claims platform",
  architectureOverview: "Governed claims intake.",
  businessOutcome: "Faster triage.",
  peopleAndSystems: [{ label: "Claims analyst", kind: "Human" }],
};

describe("ArchitectureDiagramPanel buyer-polished shell (RED)", () => {
  beforeEach(() => {
    demoEnvMock.buyerPolished = true;
    window.localStorage.clear();
  });

  it("renders first-viewport intro and hides operator chrome when diagram is ready", async () => {
    render(
      <ArchitectureDiagramPanel
        runId="run-ready"
        architectureName="Claims platform"
        sourceText={sufficientSource}
        userAssertions={assertions}
        canEdit
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    });

    expect(screen.getByTestId(ARCHITECTURE_CREATED_DIAGRAM_SKIP_TARGET_ID)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-intro")).toHaveTextContent(
      ARCHITECTURE_CREATED_DIAGRAM_PAGE_LEAD,
    );
    expect(screen.getByTestId("architecture-diagram-buyer-start-here-helper")).toHaveTextContent(
      ARCHITECTURE_CREATED_DIAGRAM_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByText(/Generated from the information provided/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-regenerate")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-mermaid-source")).not.toBeInTheDocument();
  });

  it("uses buyer insufficient copy and hides clarify/regenerate CTAs", async () => {
    render(
      <ArchitectureDiagramPanel
        runId="run-empty"
        architectureName=""
        sourceText="Too little detail."
        userAssertions={{ ...assertions, peopleAndSystems: [], architectureName: "" }}
        canEdit
        clarifyHref="/architecture/reviews/new?path=guided-intake&rerun=run-empty"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-insufficient")).toBeInTheDocument();
    });

    expect(screen.getByText(ARCHITECTURE_CREATED_DIAGRAM_BUYER_INSUFFICIENT_BODY)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: ARCHITECTURE_DIAGRAM_CLARIFY_ARCHITECTURE_ACTION })).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-insufficient-regenerate")).not.toBeInTheDocument();
  });
});
