import { isRecord, normalizeInlineText } from "./export-markdown-text";

export function formatSandboxStyleGoldenManifest(m: Record<string, unknown>): string {
  const lines: string[] = [];
  const title =
    normalizeInlineText(m.systemName) ??
    normalizeInlineText(m.manifestVersion) ??
    "Committed architecture review record";
  const env = normalizeInlineText(m.environment);
  const cloud = normalizeInlineText(m.cloudProvider);
  const status = normalizeInlineText(m.status);

  lines.push(`# ${title}`);
  lines.push("");

  if (env || cloud || status) {
    lines.push("## Document metadata");
    lines.push("");

    if (env) {
      lines.push(`- **Environment:** ${env}`);
    }

    if (cloud) {
      lines.push(`- **Cloud:** ${cloud}`);
    }

    if (status) {
      lines.push(`- **Status:** ${status}`);
    }

    lines.push("");
  }

  lines.push("## Objectives");
  lines.push("");

  const summary = isRecord(m.summary) ? m.summary : null;

  if (summary) {
    const decisionCount = summary.decisionCount;
    const warningCount = summary.warningCount;
    const unresolved = summary.unresolvedIssueCount;
    const costPosture = normalizeInlineText(summary.costPosture);

    if (typeof decisionCount === "number") {
      lines.push(`- **Decisions recorded:** ${decisionCount}`);
    }

    if (typeof warningCount === "number") {
      lines.push(`- **Warnings:** ${warningCount}`);
    }

    if (typeof unresolved === "number") {
      lines.push(`- **Unresolved issues:** ${unresolved}`);
    }

    if (costPosture) {
      lines.push(`- **Cost posture:** ${costPosture}`);
    }
  } else {
    lines.push("_No summary object was present in the review record JSON._");
  }

  lines.push("");

  lines.push("## Architecture overview");
  lines.push("");
  lines.push(
    "High-level decisions and patterns captured in this review record (from embedded highlights).",
  );
  lines.push("");

  lines.push("## Component breakdown");
  lines.push("");

  const highlights = Array.isArray(m.highlights) ? m.highlights : [];

  if (highlights.length === 0) {
    lines.push("_No highlights were present._");
  } else {
    for (const h of highlights) {
      if (!isRecord(h)) {
        continue;
      }

      const hid = normalizeInlineText(h.decisionId);
      const hTitle = normalizeInlineText(h.title);
      const category = normalizeInlineText(h.category);
      const disposition = normalizeInlineText(h.disposition);
      const rationale = normalizeInlineText(h.rationale);

      if (hTitle) {
        lines.push(`### ${hTitle}`);
        lines.push("");
      }

      if (hid) {
        lines.push(`- **Decision id:** \`${hid}\``);
      }

      if (category) {
        lines.push(`- **Category:** ${category}`);
      }

      if (disposition) {
        lines.push(`- **Disposition:** ${disposition}`);
      }

      if (rationale) {
        lines.push("");
        lines.push(rationale);
      }

      lines.push("");
    }
  }

  lines.push("## Security model");
  lines.push("");

  const warnings = Array.isArray(m.warnings) ? m.warnings : [];

  if (warnings.length === 0) {
    lines.push("_No warnings were listed on the review record._");
    lines.push("");
  } else {
    for (const w of warnings) {
      if (typeof w === "string") {
        const text = normalizeInlineText(w);

        if (text) {
          lines.push(`- ${text}`);
        }

        continue;
      }

      if (!isRecord(w)) {
        continue;
      }

      const code = normalizeInlineText(w.code);
      const message = normalizeInlineText(w.message);

      if (code && message) {
        lines.push(`- **${code}:** ${message}`);
      } else if (message) {
        lines.push(`- ${message}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
