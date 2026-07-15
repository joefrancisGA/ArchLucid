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
  ARCHITECTURE_DIAGRAM_GENERATE_ACTION,
} from "@/lib/architecture-diagram-copy";

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
  });

  it("shows insufficient diagnostic state and add-details action", async () => {
    render(
      <ArchitectureDiagramPanel
        runId="run-empty"
        architectureName="Untitled architecture"
        sourceText="Too little detail."
        userAssertions={{ ...assertions, peopleAndSystems: [], architectureName: "" }}
        canEdit
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-insufficient")).toBeInTheDocument();
    });
    expect(screen.getByText("A diagram could not be generated yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ARCHITECTURE_DIAGRAM_ADD_DETAILS_ACTION })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ARCHITECTURE_DIAGRAM_GENERATE_ACTION })).toBeInTheDocument();
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
});
