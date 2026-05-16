import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BulkEvidenceUpload } from "./BulkEvidenceUpload";

describe("BulkEvidenceUpload Component", () => {
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
});
