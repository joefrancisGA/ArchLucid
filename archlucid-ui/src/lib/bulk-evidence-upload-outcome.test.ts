import { describe, expect, it } from "vitest";

import {
  buildBulkEvidenceUploadSummary,
  mapBulkEvidenceFileOutcomes,
  parsePartialUploadCountFromDetail,
} from "./bulk-evidence-upload-outcome";

describe("bulk-evidence-upload-outcome", () => {
  it("parses partial upload count from API detail", () => {
    expect(
      parsePartialUploadCountFromDetail("An error occurred during upload. 2 of 5 files were uploaded. Error: boom"),
    ).toBe(2);
    expect(parsePartialUploadCountFromDetail("Validation failed.")).toBeNull();
  });

  it("maps sequential non-empty uploads and empty skips", () => {
    const files = [
      new File(["a"], "ok.txt"),
      new File([], "empty.txt"),
      new File(["b"], "late.txt"),
    ];

    const outcomes = mapBulkEvidenceFileOutcomes(files, 1, "Server error");

    expect(outcomes[0]?.status).toBe("uploaded");
    expect(outcomes[1]?.status).toBe("failed");
    expect(outcomes[1]?.reason).toContain("Empty");
    expect(outcomes[2]?.status).toBe("failed");
    expect(outcomes[2]?.reason).toBe("Server error");
  });

  it("builds partial summary when some files fail", () => {
    const files = [new File(["a"], "a.txt"), new File(["b"], "b.txt")];
    const summary = buildBulkEvidenceUploadSummary(files, 1, "Upload failed", "Done");

    expect(summary.isPartial).toBe(true);
    expect(summary.uploadedCount).toBe(1);
    expect(summary.failedCount).toBe(1);
    expect(summary.message).toContain("1 of 2");
  });
});
