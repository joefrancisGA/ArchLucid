import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDiagramEditor } from "@/components/architecture/ArchitectureDiagramEditor";
import {
  ARCHITECTURE_DIAGRAM_CANCEL_EDIT_ACTION,
  ARCHITECTURE_DIAGRAM_EDIT_MERMAID_ACTION,
  ARCHITECTURE_DIAGRAM_INVALID_MERMAID_ERROR,
  ARCHITECTURE_DIAGRAM_SAVE_ACTION,
  ARCHITECTURE_DIAGRAM_VERSION_HISTORY_DISCLAIMER,
} from "@/lib/architecture/architecture-diagram-copy";

describe("ArchitectureDiagramEditor", () => {
  it("disables save for invalid mermaid and supports cancel", () => {
    const onSaveMermaid = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ArchitectureDiagramEditor
        open
        onOpenChange={onOpenChange}
        mermaidSource={'flowchart TB\n  a["A"]'}
        versions={[]}
        activeVersionId={null}
        canEdit
        storageWriteFailed={false}
        onSaveMermaid={onSaveMermaid}
        onActivateVersion={() => undefined}
      />,
    );

    expect(screen.getByText(ARCHITECTURE_DIAGRAM_EDIT_MERMAID_ACTION)).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("architecture-diagram-mermaid-editor"), {
      target: { value: "not valid mermaid" },
    });
    expect(screen.getByText(ARCHITECTURE_DIAGRAM_INVALID_MERMAID_ERROR)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-save-mermaid")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: ARCHITECTURE_DIAGRAM_CANCEL_EDIT_ACTION }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSaveMermaid).not.toHaveBeenCalled();
  });

  it("saves valid mermaid edits", () => {
    const onSaveMermaid = vi.fn();

    render(
      <ArchitectureDiagramEditor
        open
        onOpenChange={() => undefined}
        mermaidSource={'flowchart TB\n  a["A"]'}
        versions={[]}
        activeVersionId="v1"
        canEdit
        storageWriteFailed={false}
        onSaveMermaid={onSaveMermaid}
        onActivateVersion={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: ARCHITECTURE_DIAGRAM_SAVE_ACTION }));
    expect(onSaveMermaid).toHaveBeenCalledWith('flowchart TB\n  a["A"]');
  });

  it("blocks edits when permission is denied", () => {
    render(
      <ArchitectureDiagramEditor
        open
        onOpenChange={() => undefined}
        mermaidSource={'flowchart TB\n  a["A"]'}
        versions={[]}
        activeVersionId={null}
        canEdit={false}
        storageWriteFailed={false}
        onSaveMermaid={() => undefined}
        onActivateVersion={() => undefined}
      />,
    );

    expect(screen.getByText(/Diagram edits are locked/)).toBeInTheDocument();
  });

  it("demotes save mermaid when Do this next owns the page primary", () => {
    render(
      <ArchitectureDiagramEditor
        open
        onOpenChange={() => undefined}
        mermaidSource={'flowchart TB\n  a["A"]'}
        versions={[]}
        activeVersionId={null}
        canEdit
        storageWriteFailed={false}
        onSaveMermaid={() => undefined}
        onActivateVersion={() => undefined}
        pagePrimaryOwnedElsewhere
      />,
    );

    expect(screen.getByTestId("architecture-diagram-save-mermaid").className).toContain("border-neutral-300");
  });

  it("shows honest device-local version history copy", () => {
    render(
      <ArchitectureDiagramEditor
        open
        onOpenChange={() => undefined}
        mermaidSource={'flowchart TB\n  a["A"]'}
        versions={[
          {
            versionId: "v1",
            savedAtUtc: "2026-07-11T12:00:00.000Z",
            source: "generated",
            mermaidSource: 'flowchart TB\n  a["A"]',
            contentFingerprint: "fp",
            label: "Generated diagram",
          },
        ]}
        activeVersionId="v1"
        canEdit
        storageWriteFailed
        onSaveMermaid={() => undefined}
        onActivateVersion={() => undefined}
      />,
    );

    expect(screen.getByText(ARCHITECTURE_DIAGRAM_VERSION_HISTORY_DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-storage-write-failure")).toBeInTheDocument();
    expect(screen.getByText(/\(Active\)/)).toBeInTheDocument();
  });
});
