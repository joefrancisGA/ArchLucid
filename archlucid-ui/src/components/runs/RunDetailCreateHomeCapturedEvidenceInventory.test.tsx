import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailCreateHomeCapturedEvidenceInventory } from "./RunDetailCreateHomeCapturedEvidenceInventory";

vi.mock("@/components/runs/StoredEvidenceFileCells", () => ({
  RunStoredEvidencePreviewDialog: () => null,
  StoredEvidenceFileCells: () => <span>Stored file actions</span>,
  useStoredEvidenceFileActions: () => ({
    preview: null,
    closePreview: vi.fn(),
    handlers: {},
    openButtonRef: { current: null },
  }),
}));

describe("RunDetailCreateHomeCapturedEvidenceInventory", () => {
  it("reports a missing evidence item id but preserves a stored empty id", () => {
    const { rerender } = render(
      <RunDetailCreateHomeCapturedEvidenceInventory
        runId="run-1"
        items={[
          {
            key: "missing",
            fileName: "missing.txt",
            contentType: "text/plain",
            evidenceItemId: null,
            ingestedUtc: "2026-08-09T12:00:00Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("missing.txt")).toBeInTheDocument();
    expect(screen.getByText("Evidence item id was not stored.")).toBeInTheDocument();

    rerender(
      <RunDetailCreateHomeCapturedEvidenceInventory
        runId="run-1"
        items={[
          {
            key: "empty",
            fileName: "empty.txt",
            contentType: "text/plain",
            evidenceItemId: "",
            ingestedUtc: "2026-08-09T12:00:00Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("empty.txt")).toBeInTheDocument();
    expect(screen.queryByText("Evidence item id was not stored.")).not.toBeInTheDocument();
  });
});
