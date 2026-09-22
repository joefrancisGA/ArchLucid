import yaml from "js-yaml";

import type { RemediationPatternRecord, RemediationPatternVersionRecord } from "@/lib/remediation-pattern-types";
import { REMEDIATION_PATTERN_STATUS } from "@/lib/remediation-pattern-status";

export type RemediationPatternYamlValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

/** Pretty-print pattern version content for read-only review panels. */
export function formatRemediationPatternVersionContent(
  contentJson: string | null | undefined,
): string | null {
  if (contentJson === null || contentJson === undefined) {
    return null;
  }

  const trimmed = contentJson.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    return JSON.stringify(parsed, null, 2);
  } catch {
    return trimmed;
  }
}

export function validateRemediationPatternYamlDraft(yamlDraft: string): RemediationPatternYamlValidationResult {
  const trimmed = yamlDraft.trim();

  if (trimmed.length === 0) {
    return { ok: false, message: "YAML content is required." };
  }

  try {
    const parsed = yaml.load(trimmed);

    if (parsed === undefined || parsed === null) {
      return { ok: false, message: "YAML must define a remediation pattern document." };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "YAML could not be parsed.";

    return { ok: false, message };
  }
}

export function remediationPatternRegistryNeedsAttention(pattern: RemediationPatternRecord): boolean {
  const approved = pattern.currentApprovedVersion?.trim() ?? "";

  return approved.length === 0;
}

export function remediationPatternRegistryAttentionLabel(pattern: RemediationPatternRecord): string {
  return remediationPatternRegistryNeedsAttention(pattern) ? "Needs attention" : "Ready";
}

export function remediationPatternRegistryStatusLabel(pattern: RemediationPatternRecord): string {
  const approved = pattern.currentApprovedVersion?.trim() ?? "";

  return approved.length > 0 ? `Approved v${approved}` : "No approved version";
}

export function findApprovedRemediationPatternVersion(
  versions: ReadonlyArray<RemediationPatternVersionRecord>,
  currentApprovedVersion: string | null | undefined,
): RemediationPatternVersionRecord | null {
  const approvedVersionLabel = currentApprovedVersion?.trim() ?? "";

  if (approvedVersionLabel.length > 0) {
    const byLabel = versions.find((version) => version.version === approvedVersionLabel);

    if (byLabel !== undefined) {
      return byLabel;
    }
  }

  return (
    versions.find((version) => version.status === REMEDIATION_PATTERN_STATUS.approved) ?? null
  );
}

export type RemediationPatternContentDiffLine = {
  readonly kind: "same" | "added" | "removed";
  readonly text: string;
};

/** Line-oriented diff for read-only approval review (client-side only). */
export function diffRemediationPatternContent(
  before: string | null,
  after: string | null,
): readonly RemediationPatternContentDiffLine[] {
  const beforeLines = (before ?? "").split("\n");
  const afterLines = (after ?? "").split("\n");
  const max = Math.max(beforeLines.length, afterLines.length);
  const lines: RemediationPatternContentDiffLine[] = [];

  for (let index = 0; index < max; index += 1) {
    const left = beforeLines[index];
    const right = afterLines[index];

    if (left === right) {
      if (right !== undefined) {
        lines.push({ kind: "same", text: right });
      }

      continue;
    }

    if (left !== undefined) {
      lines.push({ kind: "removed", text: left });
    }

    if (right !== undefined) {
      lines.push({ kind: "added", text: right });
    }
  }

  return lines;
}
