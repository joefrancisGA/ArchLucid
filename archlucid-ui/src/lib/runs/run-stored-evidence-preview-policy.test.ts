import { describe, expect, it } from "vitest";

import { StoredEvidenceFileContentSafety } from "@/lib/runs/run-stored-evidence-preview-policy";

describe("run-stored-evidence-preview-policy", () => {
  it("forces attachment for svg and html", () => {
    expect(StoredEvidenceFileContentSafety.mustForceAttachmentDisposition("image/svg+xml", "diagram.svg")).toBe(true);
    expect(StoredEvidenceFileContentSafety.mustForceAttachmentDisposition("text/html", "page.html")).toBe(true);
  });

  it("allows image preview for png", () => {
    expect(StoredEvidenceFileContentSafety.resolvePreviewKind("image/png", "diagram.png")).toBe("image");
  });

  it("falls back to download-only for unknown types", () => {
    expect(StoredEvidenceFileContentSafety.resolvePreviewKind("application/zip", "bundle.zip")).toBe("download-only");
  });
});
