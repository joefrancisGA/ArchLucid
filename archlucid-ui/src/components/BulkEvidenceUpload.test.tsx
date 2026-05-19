import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import * as bulkEvidenceUploadClient from "@/lib/bulk-evidence-upload-client";

import { BulkEvidenceUpload } from "./BulkEvidenceUpload";

vi.mock("@/lib/bulk-evidence-upload-client", () => ({
  postBulkEvidenceMultipartWithProgress: vi.fn(),
}));

const postBulkEvidence = vi.mocked(bulkEvidenceUploadClient.postBulkEvidenceMultipartWithProgress);

describe("BulkEvidenceUpload Component", () => {
  beforeEach(() => {
    postBulkEvidence.mockReset();
  });

  it("renders quota indicator '0 / 30'", () => {
    render(<BulkEvidenceUpload runId="test-run-id" />);
    expect(screen.getByText("0 / 30 files")).toBeInTheDocument();
    expect(screen.getByText("Upload up to 30 files per action")).toBeInTheDocument();
  });

  it("selecting 5 files shows '5 / 30'", () => {
    render(<BulkEvidenceUpload runId="test-run-id" />);
    
    const fileInput = screen.getByLabelText(/drag and drop evidence files here/i, { selector: 'input' });
    
    const files = Array.from({ length: 5 }).map((_, i) => new File(["content"], `file${i}.txt`, { type: "text/plain" }));
    fireEvent.change(fileInput, { target: { files } });

    expect(screen.getByText("5 / 30 files")).toBeInTheDocument();
  });

  it("selecting 31 files shows error and disables upload button", () => {
    render(<BulkEvidenceUpload runId="test-run-id" />);
    
    const fileInput = screen.getByLabelText(/drag and drop evidence files here/i, { selector: 'input' });
    
    const files = Array.from({ length: 31 }).map((_, i) => new File(["content"], `file${i}.txt`, { type: "text/plain" }));
    fireEvent.change(fileInput, { target: { files } });

    expect(screen.getByText("Maximum 30 files per upload. Please remove 1 files or upload in multiple batches.")).toBeInTheDocument();
    
    const uploadButton = screen.getByRole("button", { name: "Upload Evidence" });
    expect(uploadButton).toBeDisabled();
  });

  it("removing a file updates count", () => {
    render(<BulkEvidenceUpload runId="test-run-id" />);
    
    const fileInput = screen.getByLabelText(/drag and drop evidence files here/i, { selector: 'input' });
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(screen.getByText("1 / 30 files")).toBeInTheDocument();
    
    const removeBtn = screen.getByRole("button", { name: "Remove test.txt" });
    fireEvent.click(removeBtn);

    expect(screen.getByText("0 / 30 files")).toBeInTheDocument();
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

    const fileInput = screen.getByLabelText(/drag and drop evidence files here/i, { selector: "input" });
    fireEvent.change(fileInput, {
      target: { files: [new File(["content"], "evidence.txt", { type: "text/plain" })] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Upload Evidence" }));

    expect(await screen.findByTestId("bulk-evidence-upload-progress")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();

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

    const fileInput = screen.getByLabelText(/drag and drop evidence files here/i, { selector: "input" });
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File(["a"], "first.txt", { type: "text/plain" }),
          new File(["b"], "second.txt", { type: "text/plain" }),
        ],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Upload Evidence" }));

    await waitFor(() => {
      expect(screen.getByTestId("bulk-evidence-upload-file-outcomes")).toHaveTextContent("second.txt");
    });
  });
});
