import { formatFindingTrustExportLine } from "@/lib/findings/finding-trust-export";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

/** Per-finding trust label lines for career markdown/print exports (FC-36). */
export function formatCareerExportFindingTrustMarkdownSection(
  findings: readonly QuickDecisionFinding[],
): string {
  const lines: string[] = [];
  const exportable = findings.filter(
    (finding) => finding.isMuted !== true && finding.classification !== "ChecklistCoverage",
  );

  if (exportable.length === 0) {
    return "";
  }

  lines.push("## Finding trust labels");
  lines.push("");
  lines.push("Per-finding trust classification for this export snapshot — not a legal attestation.");
  lines.push("");

  for (const finding of exportable) {
    const trustLine = formatFindingTrustExportLine(finding);
    const title = finding.title.trim().length > 0 ? finding.title.trim() : finding.findingId;

    lines.push(
      `- **${finding.findingId}** — ${title}: ${trustLine ?? "Trust label unavailable on this snapshot."}`,
    );
  }

  lines.push("");

  return lines.join("\n");
}
