import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import * as bulkEvidenceUploadClient from "@/lib/bulk-evidence-upload-client";
import { BULK_EVIDENCE_UPLOAD_MAX_FILES } from "@/lib/bulk-evidence-upload-copy";

import { BulkEvidenceUpload } from "./BulkEvidenceUpload";

vi.mock("@/lib/bulk-evidence-upload-client", () => ({
  postBulkEvidenceMultipartWithProgress: vi.fn(),
}));

const postBulkEvidence = vi.mocked(bulkEvidenceUploadClient.postBulkEvidenceMultipartWithProgress);

describe("BulkEvidenceUpload Component", () => {
  beforeEach(() => {
    postBulkEvidence.mockReset();
  });

  it("renders quota indicator '0 / 200'", () => {
    render(<BulkEvidenceUpload runId="test-run-id" />);
    expect(screen.getByText(`0 / ${BULK_EVIDENCE_UPLOAD_MAX_FILES} files`)).toBeInTheDocument();
    expect(screen.getByText(/Upload up to 200 files per action/i)).toBeInTheDocument();
    expect(screen.getByText(/ZIP archives are expanded automatically/i)).toBeInTheDocument();
  });

  it("selecting 5 files shows '5 / 200'", () => {
    render(<BulkEvidenceUpload runId="test-run-id" />);

    const fileInput = screen.getByTestId("evidence-file-input");

    const files = Array.from({ length: 5 }).map((_, i) => new File(["content"], `file${i}.txt`, { type: "text/plain" }));
    fireEvent.change(fileInput, { target: { files } });

    expect(screen.getByText(`5 / ${BULK_EVIDENCE_UPLOAD_MAX_FILES} files`)).toBeInTheDocument();
  });

  it("selecting 201 files shows error and disables upload button", () => {
    render(<BulkEvidenceUpload runId="test-run-id" />);

    const fileInput = screen.getByTestId("evidence-file-input");

    const files = Array.from({ length: 201 }).map((_, i) => new File(["content"], `file${i}.txt`, { type: "text/plain" }));
    fireEvent.change(fileInput, { target: { files } });

    expect(
      screen.getByText(
        "Maximum 200 files per upload. Please remove 1 files or upload in multiple batches.",
      ),
    ).toBeInTheDocument();

    const uploadButton = screen.getByRole("button", { name: "Upload evidence" });
    expect(uploadButton).toBeDisabled();
  });

  it("removing a file updates count", () => {
    render(<BulkEvidenceUpload runId="test-run-id" />);

    const fileInput = screen.getByTestId("evidence-file-input");
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText("1 / 200 files")).toBeInTheDocument();

    const removeBtn = screen.getByRole("button", { name: "Remove test.txt" });
    fireEvent.click(removeBtn);

    expect(screen.getByText("0 / 200 files")).toBeInTheDocument();
  });

  it("shows upload progress and success summary", async () => {
    let finishUpload: ((value: { status: number; bodyText: string }) => void) | undefined;

    postBulkEvidence.mockImplementation((_runId, _files, onProgress) => {
      onProgress({ loadedBytes: 50, totalBytes: 100, percent: 50 });

      return new Promise((resolve) => {
        finishUpload = resolve;
      });
    });

    render(<BulkEvidenceUpload runId="test-run-id" />);

    const fileInput = screen.getByTestId("evidence-file-input");
    fireEvent.change(fileInput, {
      target: { files: [new File(["content"], "evidence.txt", { type: "text/plain" })] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Upload evidence" }));

    expect(await screen.findByTestId("bulk-evidence-upload-progress")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByTestId("bulk-evidence-upload-cancel")).toBeInTheDocument();

    finishUpload?.({
      status: 200,
      bodyText: JSON.stringify({ evidenceItemIds: ["id-1"] }),
    });

    await waitFor(() => {
      expect(screen.getByTestId("bulk-evidence-upload-summary")).toHaveTextContent("Evidence successfully uploaded");
    });
  });

  it("lists failed files after partial upload", async () => {
    postBulkEvidence.mockResolvedValue({
      status: 400,
      bodyText: JSON.stringify({
        detail: "An error occurred during upload. 1 of 2 files were uploaded. Error: storage",
      }),
    });

    render(<BulkEvidenceUpload runId="test-run-id" />);

    const fileInput = screen.getByTestId("evidence-file-input");
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File(["a"], "first.txt", { type: "text/plain" }),
          new File(["b"], "second.txt", { type: "text/plain" }),
        ],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Upload evidence" }));

    await waitFor(() => {
      expect(screen.getByTestId("bulk-evidence-upload-file-outcomes")).toHaveTextContent("second.txt");
    });
  });

  it("enables retry after a failed upload when files remain selected", async () => {
    postBulkEvidence.mockResolvedValue({
      status: 500,
      bodyText: JSON.stringify({ detail: "Internal storage failure" }),
    });

    render(<BulkEvidenceUpload runId="test-run-id" />);

    const fileInput = screen.getByTestId("evidence-file-input");
    fireEvent.change(fileInput, {
      target: { files: [new File(["content"], "retry-me.txt", { type: "text/plain" })] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Upload evidence" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-error-recovery-what-failed")).toBeInTheDocument();
    });

    expect(screen.getByTestId("bulk-evidence-upload-error-diagnostics")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry upload" })).toBeEnabled();
  });

  it("cancels an in-flight upload", async () => {
    let rejectUpload: ((error: DOMException) => void) | undefined;

    postBulkEvidence.mockImplementation((_runId, _files, _onProgress, signal) => {
      return new Promise((_resolve, reject) => {
        rejectUpload = reject;

        signal?.addEventListener("abort", () => {
          reject(new DOMException("Upload aborted", "AbortError"));
        });
      });
    });

    render(<BulkEvidenceUpload runId="test-run-id" />);

    const fileInput = screen.getByTestId("evidence-file-input");
    fireEvent.change(fileInput, {
      target: { files: [new File(["content"], "cancel-me.txt", { type: "text/plain" })] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Upload evidence" }));

    await waitFor(() => {
      expect(screen.getByTestId("bulk-evidence-upload-cancel")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("bulk-evidence-upload-cancel"));

    await waitFor(() => {
      expect(screen.getByText("Upload canceled.")).toBeInTheDocument();
    });

    expect(rejectUpload).toBeDefined();
    expect(screen.getByTestId("operator-error-recovery-next-step")).toHaveTextContent(/submitted evidence inventory/i);
  });

  it("does not expose a focusable drop-zone button", () => {
    render(<BulkEvidenceUpload runId="test-run-id" embedded />);

    expect(screen.getByTestId("bulk-evidence-drop-zone")).not.toHaveAttribute("role", "button");
    expect(screen.getByTestId("bulk-evidence-drop-zone")).not.toHaveAttribute("tabindex");
    expect(screen.getByText("Select files")).toBeInTheDocument();
    expect(screen.getByText("Select folder")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-file-input")).toBeInTheDocument();
  });

  it("shows full file names without title tooltips", () => {
    render(<BulkEvidenceUpload runId="test-run-id" />);

    const longName = "quarterly-architecture-brief-with-a-very-long-filename-for-wrapping.txt";
    const fileInput = screen.getByTestId("evidence-file-input");

    fireEvent.change(fileInput, {
      target: { files: [new File(["content"], longName, { type: "text/plain" })] },
    });

    const nameEl = screen.getByText(longName);

    expect(nameEl).toHaveClass("break-all");
    expect(nameEl).not.toHaveAttribute("title");
  });
});
