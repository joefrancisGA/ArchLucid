import {
  getGovernanceConflictLosers,
  getGovernanceConflictWinner,
  resolveGovernanceConflictWhy,
} from "@/lib/governance-conflict-resolution";
import { triggerGoldenManifestMarkdownDownload } from "@/lib/export-markdown";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

function mdCell(value: string): string {
  return value.replace(/\|/g, "/").replace(/\r\n/g, "\n").replace(/\n/g, " ").trim();
}

function formatSnapshotInstantUtc(exportedAtUtc: Date): string {
  return exportedAtUtc.toISOString();
}

/**
 * Builds a point-in-time Markdown snapshot of `GET /v1/governance-resolution` for compliance handoff.
 */
export function buildGovernanceResolutionMarkdown(
  result: EffectiveGovernanceResolutionResult,
  exportedAtUtc: Date,
): string {
  const snapshotAt = formatSnapshotInstantUtc(exportedAtUtc);
  const lines: string[] = [
    "# Governance resolution snapshot",
    "",
    "> **Point-in-time export.** This document reflects effective governance at the moment it was downloaded.",
    `> It is **not** a live view. Snapshot captured: **${snapshotAt}** (UTC).`,
    "",
    "## Scope",
    "",
    `- **Tenant:** \`${result.tenantId}\``,
    `- **Workspace:** \`${result.workspaceId}\``,
    `- **Project:** \`${result.projectId}\``,
    "",
    "## Summary notes",
    "",
  ];

  if (result.notes.length === 0) {
    lines.push("_No summary notes._", "");
  } else {
    for (const note of result.notes) {
      lines.push(`- ${note}`);
    }

    lines.push("");
  }

  lines.push("## Policy pack conflicts", "");

  if (result.conflicts.length === 0) {
    lines.push("_No conflicts detected._", "");
  } else {
    lines.push(
      "| Item | Conflict | Winner | Why it won | Losing packs |",
      "| --- | --- | --- | --- | --- |",
    );

    for (const conflict of result.conflicts) {
      const winner = getGovernanceConflictWinner(conflict.candidates);
      const losers = getGovernanceConflictLosers(conflict.candidates, winner);
      const why = resolveGovernanceConflictWhy(conflict, result.decisions);
      const item = `${conflict.itemType} \`${conflict.itemKey}\``;
      const winnerLabel =
        winner === null
          ? "—"
          : `${winner.policyPackName} (v${winner.version}, ${winner.scopeLevel})`;
      const losersLabel =
        losers.length === 0
          ? "—"
          : losers.map((l) => `${l.policyPackName} (v${l.version}, ${l.scopeLevel})`).join("; ");

      lines.push(
        `| ${mdCell(item)} | ${mdCell(`${conflict.conflictType}: ${conflict.description}`)} | ${mdCell(winnerLabel)} | ${mdCell(why)} | ${mdCell(losersLabel)} |`,
      );
    }

    lines.push("");
  }

  lines.push("## Resolution decisions", "");

  if (result.decisions.length === 0) {
    lines.push("_No resolution decisions._", "");
  } else {
    for (const decision of result.decisions) {
      lines.push(
        `### ${decision.itemType} — \`${decision.itemKey}\``,
        "",
        `- **Winner:** ${decision.winningPolicyPackName} (v${decision.winningVersion}, scope ${decision.winningScopeLevel})`,
        `- **Reason:** ${decision.resolutionReason}`,
        "",
      );
    }
  }

  lines.push("## Effective content (JSON)", "", "```json", JSON.stringify(result.effectiveContent, null, 2), "```", "");

  return lines.join("\n");
}

export function governanceResolutionMarkdownFilename(projectId: string): string {
  const safe = projectId.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 80);

  return `governance-resolution-${safe.length > 0 ? safe : "scope"}.md`;
}

export function triggerGovernanceResolutionMarkdownDownload(
  result: EffectiveGovernanceResolutionResult,
  exportedAtUtc: Date = new Date(),
): void {
  const markdown = buildGovernanceResolutionMarkdown(result, exportedAtUtc);
  const filename = governanceResolutionMarkdownFilename(result.projectId);

  triggerGoldenManifestMarkdownDownload(markdown, filename);
}
