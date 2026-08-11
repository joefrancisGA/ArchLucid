/**
 * TB-2202 - Export format when-to-use chooser.
 * SoT for Markdown / PDF / DOCX / ZIP labels, one-line guidance, and sponsor job affinity.
 */

export type ExportFormatId = "markdown" | "pdf" | "docx" | "zip";

/** Sponsor job the format is best suited for. */
export type ExportFormatRecommendedFor = "email" | "print" | "archive" | "edit";

export type ExportFormatWhenToUse = {
  readonly id: ExportFormatId;
  readonly label: string;
  readonly whenToUse: string;
  readonly recommendedFor: ExportFormatRecommendedFor;
};

/** Markdown - lightweight paste into email or chat. */
export const EXPORT_FORMAT_MARKDOWN: ExportFormatWhenToUse = {
  id: "markdown",
  label: "Markdown - email brief",
  whenToUse: "Paste into email or chat for a quick sponsor brief.",
  recommendedFor: "email",
};

/** PDF - fixed layout for print or attach-as-packet. */
export const EXPORT_FORMAT_PDF: ExportFormatWhenToUse = {
  id: "pdf",
  label: "PDF - print packet",
  whenToUse: "Print or attach a fixed-layout packet for reading offline.",
  recommendedFor: "print",
};

/** DOCX - editable Word handoff for annotation. */
export const EXPORT_FORMAT_DOCX: ExportFormatWhenToUse = {
  id: "docx",
  label: "DOCX - editable handoff",
  whenToUse: "Open in Word when sponsors need to annotate or rewrite.",
  recommendedFor: "edit",
};

/** ZIP - full evidence / package archive. */
export const EXPORT_FORMAT_ZIP: ExportFormatWhenToUse = {
  id: "zip",
  label: "ZIP - archive",
  whenToUse: "Download the full evidence bundle for records retention.",
  recommendedFor: "archive",
};

const EXPORT_FORMAT_WHEN_TO_USE_BY_ID: Record<ExportFormatId, ExportFormatWhenToUse> = {
  markdown: EXPORT_FORMAT_MARKDOWN,
  pdf: EXPORT_FORMAT_PDF,
  docx: EXPORT_FORMAT_DOCX,
  zip: EXPORT_FORMAT_ZIP,
};

/** Ordered chooser options (email brief, print, edit, archive). */
export function listExportFormatWhenToUse(): readonly ExportFormatWhenToUse[] {
  return [EXPORT_FORMAT_MARKDOWN, EXPORT_FORMAT_PDF, EXPORT_FORMAT_DOCX, EXPORT_FORMAT_ZIP];
}

/** Lookup a single format entry; throws if the id is not in the SoT map. */
export function getExportFormatWhenToUse(id: ExportFormatId): ExportFormatWhenToUse {
  const entry = EXPORT_FORMAT_WHEN_TO_USE_BY_ID[id];

  if (entry === undefined) {
    throw new Error(`Unknown export format id: ${String(id)}`);
  }

  return entry;
}

/** Formats recommended for a given sponsor job. */
export function listExportFormatsRecommendedFor(
  recommendedFor: ExportFormatRecommendedFor,
): readonly ExportFormatWhenToUse[] {
  return listExportFormatWhenToUse().filter((entry) => entry.recommendedFor === recommendedFor);
}
