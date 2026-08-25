import { parseCompareManifestGovernanceSnapshot } from "@/lib/compare-effective-governance-diff";

import { isRecord, normalizeInlineText, pushBulletLines } from "./export-markdown-text";

export function formatPolicySection(policy: Record<string, unknown> | null, lines: string[]): void {
  if (policy === null) {
    return;
  }

  pushBulletLines(lines, policy.notes, undefined);

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
      const label = [id, name].filter(Boolean).join(" — ");

      if (label) {
        lines.push(`- ${label}`);
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
      const label = [id, name].filter(Boolean).join(" — ");

      if (label) {
        lines.push(`- ${label}`);
      }
    }

    lines.push("");
  }
}

export function pushPolicyAtCommitMarkdownLines(manifest: Record<string, unknown>, lines: string[]): void {
  const snapshot = parseCompareManifestGovernanceSnapshot(manifest).atCommit;

  if (snapshot === null) {
    return;
  }

  lines.push("## Policy scope at commit");
  lines.push("");

  if (!snapshot.hasEffectivePolicy) {
    lines.push("_No effective policy pack assignments or compliance rule keys were recorded at commit._");
    lines.push("");
    return;
  }

  lines.push(
    `- **Pack assignments:** ${snapshot.packAssignments.length} · **Compliance rule keys:** ${snapshot.complianceRuleKeyCount}${
      snapshot.conflictCount > 0 ? ` · **Merge conflicts:** ${snapshot.conflictCount}` : ""
    }`,
  );

  for (const row of snapshot.packAssignments) {
    lines.push(`- Pack \`${row.policyPackId}\` v${row.policyPackVersion} (${row.scopeLevel})`);
  }

  for (const row of snapshot.coverageAssignments) {
    const dimension = row.qualityDimension ?? "unspecified dimension";
    const exclusion =
      row.exclusionReason !== null && row.exclusionReason.length > 0
        ? ` · excluded: ${row.exclusionReason}`
        : "";
    lines.push(
      `- Coverage \`${row.policyPackId}\` v${row.policyPackVersion} · ${dimension} · ${row.coverageType} · ${row.selectionState}${exclusion}`,
    );
  }

  lines.push("");
}
