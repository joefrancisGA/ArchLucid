/** Standardized ROI methodology footer for sponsor-facing markdown exports. */
export function buildSponsorMarkdownMethodologyFooter(options?: {
  readonly collectionTimestamp?: string | null;
}): string {
  const lines: string[] = [
    "---",
    "",
    "## Methodology and limitations",
    "",
    "Savings and cost figures in this export are **directional estimates**, not audited financial statements.",
    "See the [Pilot ROI model](/value-report/roi) for methodology.",
  ];

  const timestamp = options?.collectionTimestamp?.trim() ?? "";

  if (timestamp.length > 0) {
    lines.push("", `Azure cost context collection timestamp (when present): \`${timestamp}\`.`);
  }

  lines.push("");

  return lines.join("\n");
}
