import { describe, expect, it } from "vitest";

import {
  EXPORT_FORMAT_DOCX,
  EXPORT_FORMAT_MARKDOWN,
  EXPORT_FORMAT_PDF,
  EXPORT_FORMAT_ZIP,
  getExportFormatWhenToUse,
  listExportFormatWhenToUse,
  listExportFormatsRecommendedFor,
  type ExportFormatId,
  type ExportFormatRecommendedFor,
} from "@/lib/export-format-when-to-use";

describe("export-format-when-to-use (TB-2202)", () => {
  it("lists markdown, pdf, docx, and zip in sponsor-job order", () => {
    const entries = listExportFormatWhenToUse();

    expect(entries).toHaveLength(4);
    expect(entries.map((entry) => entry.id)).toEqual(["markdown", "pdf", "docx", "zip"]);
    expect(entries[0]).toEqual(EXPORT_FORMAT_MARKDOWN);
    expect(entries[1]).toEqual(EXPORT_FORMAT_PDF);
    expect(entries[2]).toEqual(EXPORT_FORMAT_DOCX);
    expect(entries[3]).toEqual(EXPORT_FORMAT_ZIP);
  });

  it("getExportFormatWhenToUse returns the SoT entry for each id", () => {
    const ids: ExportFormatId[] = ["markdown", "pdf", "docx", "zip"];

    for (const id of ids) {
      expect(getExportFormatWhenToUse(id).id).toBe(id);
    }

    expect(getExportFormatWhenToUse("markdown")).toEqual(EXPORT_FORMAT_MARKDOWN);
    expect(getExportFormatWhenToUse("zip")).toEqual(EXPORT_FORMAT_ZIP);
  });

  it("labels each format by sponsor job and keeps non-empty when-to-use copy", () => {
    const entries = listExportFormatWhenToUse();

    for (const entry of entries) {
      expect(entry.label.trim().length).toBeGreaterThan(4);
      expect(entry.whenToUse.trim().length).toBeGreaterThan(20);
      expect(entry.whenToUse.includes("\n")).toBe(false);
    }

    expect(EXPORT_FORMAT_MARKDOWN.label.toLowerCase()).toContain("email");
    expect(EXPORT_FORMAT_PDF.label.toLowerCase()).toContain("print");
    expect(EXPORT_FORMAT_DOCX.label.toLowerCase()).toContain("edit");
    expect(EXPORT_FORMAT_ZIP.label.toLowerCase()).toContain("archive");
  });

  it("maps recommendedFor to the expected sponsor jobs", () => {
    const expected: Record<ExportFormatId, ExportFormatRecommendedFor> = {
      markdown: "email",
      pdf: "print",
      docx: "edit",
      zip: "archive",
    };

    for (const entry of listExportFormatWhenToUse()) {
      expect(entry.recommendedFor).toBe(expected[entry.id]);
    }

    expect(listExportFormatsRecommendedFor("email").map((e) => e.id)).toEqual(["markdown"]);
    expect(listExportFormatsRecommendedFor("print").map((e) => e.id)).toEqual(["pdf"]);
    expect(listExportFormatsRecommendedFor("edit").map((e) => e.id)).toEqual(["docx"]);
    expect(listExportFormatsRecommendedFor("archive").map((e) => e.id)).toEqual(["zip"]);
  });
});