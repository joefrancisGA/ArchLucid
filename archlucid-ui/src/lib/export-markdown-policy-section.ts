import {
  formatAtCommitCoverageTypeForExport,
  formatAtCommitPolicyPackVersionForExport,
  formatAtCommitQualityDimensionForExport,
  formatAtCommitSelectionStateForExport,
  parseCompareManifestGovernanceSnapshot,
  POLICY_PACK_VERSION_NOT_STORED,
} from "@/lib/compare-effective-governance-diff";

import { isRecord, normalizeInlineText, pushBulletLines } from "./export-markdown-text";

export const POLICY_SECTION_NOT_STORED_COPY = "Policy section was not stored." as const;

export const POLICY_PACK_ID_NOT_STORED_COPY = "Policy pack id was not stored." as const;

export const POLICY_PACK_ID_STORED_EMPTY_COPY = "Policy pack id was stored empty." as const;

export function formatAtCommitPolicyPackIdForExport(raw: unknown): string {
  if (raw === null || raw === undefined) {
    return POLICY_PACK_ID_NOT_STORED_COPY;
  }

  if (typeof raw !== "string") {
    return POLICY_PACK_ID_NOT_STORED_COPY;
  }

  if (raw.length === 0) {
    return POLICY_PACK_ID_STORED_EMPTY_COPY;
  }

  const trimmed = raw.trim();

  return trimmed.length > 0 ? trimmed : POLICY_PACK_ID_STORED_EMPTY_COPY;
}

export function formatPolicySection(policy: Record<string, unknown> | null, lines: string[]): void {
  if (policy === null) {
    lines.push("## Policy");
    lines.push("");
    lines.push(POLICY_SECTION_NOT_STORED_COPY);
    lines.push("");

    return;
  }

  if (policy.notes === null || policy.notes === undefined) {
    lines.push("## Policy");
    lines.push("");
    lines.push("Policy notes were not stored.");
    lines.push("");
  } else {
    pushBulletLines(lines, policy.notes, undefined);
  }

  const satisfied = policy.satisfiedControls;
  const violations = policy.violations;

  if (Array.isArray(satisfied) && satisfied.length > 0) {
    lines.push("### Policy — satisfied controls");
    lines.push("");

    for (const c of satisfied) {
      if (!isRecord(c)) {
        continue;
      }

      const id = normalizeInlineText(c.controlId);
      const name = normalizeInlineText(c.controlName);
      const missingId = c.controlId === null || c.controlId === undefined;
      const missingName = c.controlName === null || c.controlName === undefined;
      const label = [id, name].filter((value): value is string => value !== null && value.length > 0).join(" — ");

      if (missingId && missingName) {
        lines.push("- Control name was not stored.");
      } else {
        lines.push(`- ${label}${missingId ? " Control id was not stored." : ""}${missingName ? " Control name was not stored." : ""}`);
      }
    }

    lines.push("");
  }

  if (Array.isArray(violations) && violations.length > 0) {
    lines.push("### Policy — violations");
    lines.push("");

    for (const c of violations) {
      if (!isRecord(c)) {
        continue;
      }

      const id = normalizeInlineText(c.controlId);
      const name = normalizeInlineText(c.controlName);
      const missingId = c.controlId === null || c.controlId === undefined;
      const missingName = c.controlName === null || c.controlName === undefined;
      const label = [id, name].filter((value): value is string => value !== null && value.length > 0).join(" — ");

      if (missingId && missingName) {
        lines.push("- Control name was not stored.");
      } else {
        lines.push(`- ${label}${missingId ? " Control id was not stored." : ""}${missingName ? " Control name was not stored." : ""}`);
      }
    }

    lines.push("");
  }
}

export function pushPolicyAtCommitMarkdownLines(manifest: Record<string, unknown>, lines: string[]): void {
  const snapshot = parseCompareManifestGovernanceSnapshot(manifest).atCommit;

  if (snapshot === null) {
    lines.push("Policy at commit was not stored.");
    return;
  }

  lines.push("## Policy scope at commit");
  lines.push("");

  if (snapshot.hasEffectivePolicy === null) {
    lines.push("Effective policy flag was not stored.");
    lines.push("");
    return;
  }

  if (!snapshot.hasEffectivePolicy) {
    lines.push("_No effective policy pack assignments or compliance rule keys were recorded at commit._");
    lines.push("");
    return;
  }

  lines.push(
    `- **Pack assignments:** ${snapshot.packAssignments.length} · **Compliance rule keys:** ${
      snapshot.complianceRuleKeyCount === null
        ? "Compliance rule key count was not stored."
        : snapshot.complianceRuleKeyCount
    }${
      snapshot.conflictCount === null
        ? " · Merge conflict count was not stored."
        : snapshot.conflictCount > 0
          ? ` · **Merge conflicts:** ${snapshot.conflictCount}`
          : ""
    }`,
  );

  for (const row of snapshot.packAssignments) {
    const version = formatAtCommitPolicyPackVersionForExport(row.policyPackVersion);
    const packId = formatAtCommitPolicyPackIdForExport(row.policyPackId);
    lines.push(`- Pack \`${packId}\`${version.length > 0 ? ` ${version}` : ""} (${row.scopeLevel})`);
  }

  for (const row of snapshot.coverageAssignments) {
    const version = formatAtCommitPolicyPackVersionForExport(row.policyPackVersion);
    const packId = formatAtCommitPolicyPackIdForExport(row.policyPackId);
    const qualityDimension = formatAtCommitQualityDimensionForExport(row.qualityDimension);
    const coverageType = formatAtCommitCoverageTypeForExport(row.coverageType);
    const selectionState = formatAtCommitSelectionStateForExport(row.selectionState);
    const exclusion =
      row.exclusionReason !== null && row.exclusionReason.length > 0
        ? ` · excluded: ${row.exclusionReason}`
        : "";
    lines.push(
      `- Coverage \`${packId}\`${version.length > 0 ? ` ${version}` : ""} · ${qualityDimension} · ${coverageType} · ${selectionState}${exclusion}`,
    );
  }

  lines.push("");
}
