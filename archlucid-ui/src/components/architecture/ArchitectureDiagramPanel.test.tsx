import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/components/architecture/ArchitectureDiagramViewer", () => ({
  ArchitectureDiagramViewer: (props: { readonly mermaidSource: string; readonly onRetry?: () => void }) => (
    <div data-testid="architecture-diagram-viewer-mock">{props.mermaidSource}</div>
  ),
}));

import { ArchitectureDiagramPanel } from "@/components/architecture/ArchitectureDiagramPanel";
import {
  ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION,
  ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION,
  ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION,
  ARCHITECTURE_DIAGRAM_DRAFT_STATUS_LABEL,
  ARCHITECTURE_DIAGRAM_RENDER_FAILURE,
  ARCHITECTURE_DIAGRAM_RETRY_ACTION,
  ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION,
} from "@/lib/architecture/architecture-diagram-copy";
import * as generateModule from "@/lib/architecture/architecture-diagram-generate";

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

describe("ArchitectureDiagramPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders a generated diagram when information is sufficient", async () => {
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
    expect(screen.getByText(/Generated from the information provided/)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_DIAGRAM_DRAFT_STATUS_LABEL)).toBeInTheDocument();
  });

  it("links Add details to run-scoped guided intake when clarifyHref is provided (TB-1842)", async () => {
    const clarifyHref = "/architecture/reviews/new?path=guided-intake&rerun=run-empty";

    render(
      <ArchitectureDiagramPanel
        runId="run-empty"
        architectureName="Untitled architecture"
        sourceText="Too little detail."
        userAssertions={{ ...assertions, peopleAndSystems: [], architectureName: "" }}
        canEdit
        clarifyHref={clarifyHref}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-insufficient")).toBeInTheDocument();
    });

    const addDetailsLink = screen.getByRole("link", { name: ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION });
    expect(addDetailsLink).toHaveAttribute("href", clarifyHref);
    expect(addDetailsLink.getAttribute("href")).toContain("rerun=run-empty");
  });

  it("shows insufficient diagnostic state and clarifications action without regenerate", async () => {
    const onClarificationsNavigate = vi.fn();

    render(
      <ArchitectureDiagramPanel
        runId="run-empty"
        architectureName="Untitled architecture"
        sourceText="Too little detail."
        userAssertions={{ ...assertions, peopleAndSystems: [], architectureName: "" }}
        canEdit
        onClarificationsNavigate={onClarificationsNavigate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-insufficient")).toBeInTheDocument();
    });
    expect(screen.getByText("A diagram could not be generated yet.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION }));
    expect(onClarificationsNavigate).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Generate architecture diagram" })).not.toBeInTheDocument();
  });

  it("shows generation failure with retry", async () => {
    vi.spyOn(generateModule, "generateArchitectureDiagramAsync").mockRejectedValue(new Error("boom"));

    render(
      <ArchitectureDiagramPanel
        runId="run-error"
        architectureName="Claims platform"
        sourceText={sufficientSource}
        userAssertions={assertions}
        canEdit
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-generation-failure")).toBeInTheDocument();
    });
    expect(screen.getByText(ARCHITECTURE_DIAGRAM_RENDER_FAILURE)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: ARCHITECTURE_DIAGRAM_RETRY_ACTION }));
  });

  it("preview variant shows draft caveat and clipped affordance", async () => {
    render(
      <ArchitectureDiagramPanel
        runId="run-preview"
        architectureName="Claims platform"
        sourceText={sufficientSource}
        userAssertions={assertions}
        canEdit
        variant="preview"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-preview")).toBeInTheDocument();
      expect(screen.getByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    });
    expect(screen.getByText(ARCHITECTURE_DIAGRAM_DRAFT_STATUS_LABEL)).toBeInTheDocument();
    expect(screen.getByText(/Draft diagram — confirm or edit/)).toBeInTheDocument();
    expect(screen.getByText(/Preview clipped/)).toBeInTheDocument();
  });

  it("supports explicit regeneration", async () => {
    render(
      <ArchitectureDiagramPanel
        runId="run-regenerate"
        architectureName="Claims platform"
        sourceText={sufficientSource}
        userAssertions={assertions}
        canEdit
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-regenerate")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-diagram-regenerate"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    });
  });

  it("locks edit controls when diagram edits are not permitted", async () => {
    render(
      <ArchitectureDiagramPanel
        runId="run-readonly"
        architectureName="Claims platform"
        sourceText={sufficientSource}
        userAssertions={assertions}
        canEdit={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-viewer-mock")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Edit diagram" })).not.toBeInTheDocument();
  });

  it("gates Mermaid source copy and download behind disclosure by default (TB-1844)", async () => {
    render(
      <ArchitectureDiagramPanel
        runId="run-mermaid-disclosure"
        architectureName="Claims platform"
        sourceText={sufficientSource}
        userAssertions={assertions}
        canEdit
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-mermaid-source")).toBeInTheDocument();
    });

    expect(screen.getByText(ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION, hidden: true })).not.toBeVisible();
    expect(screen.getByRole("button", { name: ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION, hidden: true })).not.toBeVisible();

    fireEvent.click(screen.getByText(ARCHITECTURE_DIAGRAM_VIEW_MERMAID_ACTION));

    expect(screen.getByRole("button", { name: ARCHITECTURE_DIAGRAM_COPY_MERMAID_ACTION })).toBeVisible();
    expect(screen.getByRole("button", { name: ARCHITECTURE_DIAGRAM_DOWNLOAD_ACTION })).toBeVisible();
  });

  it("reports unconfirmed inferred count changes", async () => {
    const onCountChange = vi.fn();

    render(
      <ArchitectureDiagramPanel
        runId="run-inferred-count"
        architectureName="Claims platform"
        sourceText={`## Systems and services
- Inferred billing adapter
## Users and stakeholders
- Claims analyst
## Data flows
Claims analyst -> Inferred billing adapter`}
        userAssertions={assertions}
        canEdit
        onUnconfirmedInferredCountChange={onCountChange}
      />,
    );

    await waitFor(() => {
      expect(onCountChange).toHaveBeenCalledWith(expect.any(Number));
    });
  });
});
