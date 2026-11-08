import { describe, expect, it } from "vitest";

import {
  EXPORT_PREVIEW_SHORTENED_SUFFIX,
  formatExportPreviewCapIntro,
  formatExportPreviewShortenedText,
} from "@/lib/export-preview-caption-honesty";
import { resolveFindingExplainabilityTraceListDisplay } from "@/lib/findings/finding-explainability-trace-list-display";

describe("export-preview-caption-honesty", () => {
  it("marks long preview text as shortened", () => {
    const long = "x".repeat(120);

    expect(formatExportPreviewShortenedText(long, "not stored", 96)).toContain(EXPORT_PREVIEW_SHORTENED_SUFFIX);
  });

  it("formats capped list intro", () => {
    expect(formatExportPreviewCapIntro(3, 10, "talking points")).toBe("3 of 10 talking points");
    expect(formatExportPreviewCapIntro(5, 5, "decisions")).toBe("5 decisions");
  });
});

describe("resolveFindingExplainabilityTraceListDisplay", () => {
  it("distinguishes stored empty from not stored using missingTraceFields", () => {
    const emptyStored = resolveFindingExplainabilityTraceListDisplay({
      values: [],
      fieldKey: "notes",
      missingTraceFields: ["notes"],
      notStoredLabel: "Notes were not stored.",
      storedEmptyLabel: "Notes were stored empty.",
    });

    expect(emptyStored).toEqual({ kind: "message", message: "Notes were stored empty." });

    const notStored = resolveFindingExplainabilityTraceListDisplay({
      values: [],
      fieldKey: "notes",
      missingTraceFields: [],
      notStoredLabel: "Notes were not stored.",
      storedEmptyLabel: "Notes were stored empty.",
    });

    expect(notStored).toEqual({ kind: "message", message: "Notes were not stored." });
  });
});
