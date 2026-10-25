import { isRecord, normalizeInlineText } from "./export-markdown-text";

export function formatSandboxStyleGoldenManifest(m: Record<string, unknown>): string {
  const lines: string[] = [];
  const systemName = normalizeInlineText(m.systemName);
  const title =
    systemName ??
    (m.systemName === null || m.systemName === undefined
      ? "System name was not stored."
      : "System name was stored empty.");
  const env = normalizeInlineText(m.environment);
  const cloud = normalizeInlineText(m.cloudProvider);
  const status = normalizeInlineText(m.status);
  const architectureOverview = normalizeInlineText(m.architectureOverview);

  lines.push(`# ${title}`);
  lines.push("");

  if (
    typeof m.environment === "string" ||
    m.environment === null ||
    m.environment === undefined ||
    m.cloudProvider === null ||
    m.cloudProvider === undefined ||
    typeof m.cloudProvider === "string" ||
    m.status === null ||
    m.status === undefined ||
    typeof m.status === "string"
  ) {
    lines.push("## Document metadata");
    lines.push("");

    if (m.environment === null || m.environment === undefined) {
      lines.push("- Environment was not stored.");
    } else if (typeof m.environment === "string" && m.environment.length === 0) {
      lines.push("- Environment was stored empty.");
    } else if (typeof m.environment === "string") {
      lines.push(`- **Environment:** ${env ?? ""}`);
    }

    if (m.cloudProvider === null || m.cloudProvider === undefined) {
      lines.push("- Cloud was not stored.");
    } else if (cloud) {
      lines.push(`- **Cloud:** ${cloud}`);
    } else if (typeof m.cloudProvider === "string") {
      lines.push("- Cloud was stored empty.");
    }

    if (m.status === null || m.status === undefined) {
      lines.push("- Status was not stored.");
    } else if (status) {
      lines.push(`- **Status:** ${status}`);
    } else if (typeof m.status === "string") {
      lines.push("- Status was stored empty.");
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
    } else if ("decisionCount" in summary) {
      lines.push("- Decision count was not stored.");
    }

    if (typeof warningCount === "number") {
      lines.push(`- **Warnings:** ${warningCount}`);
    } else if ("warningCount" in summary) {
      lines.push("- Warning count was not stored.");
    }

    if (typeof unresolved === "number") {
      lines.push(`- **Unresolved issues:** ${unresolved}`);
    } else if ("unresolvedIssueCount" in summary) {
      lines.push("- Unresolved issue count was not stored.");
    }

    if (costPosture) {
      lines.push(`- **Cost posture:** ${costPosture}`);
    } else if ("costPosture" in summary) {
      lines.push("- Cost posture was not stored.");
    }
  } else {
    lines.push("_No summary object was present in the review record JSON._");
  }

  lines.push("");

  lines.push("## Architecture overview");
  lines.push("");

  if (m.architectureOverview === null || m.architectureOverview === undefined) {
    lines.push("Architecture overview was not stored.");
  } else if (architectureOverview) {
    lines.push(architectureOverview);
  } else if (typeof m.architectureOverview === "string") {
    lines.push("Architecture overview was stored as an empty string.");
  } else {
    lines.push("Architecture overview was not stored.");
  }

  lines.push("");

  lines.push("## Component breakdown");
  lines.push("");

  const highlights = Array.isArray(m.highlights) ? m.highlights : [];

  if (highlights.length === 0) {
    if (m.highlights === null || m.highlights === undefined) {
      lines.push("Highlights were not stored.");
    } else {
      lines.push("_No highlights were present._");
    }
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
      } else if (h.title === null || h.title === undefined) {
        lines.push("Highlight title was not stored.");
        lines.push("");
      }

      if (hid) {
        lines.push(`- **Decision id:** \`${hid}\``);
      }

      if (h.category === null || h.category === undefined) {
        lines.push("- Category was not stored.");
      } else if (typeof h.category === "string" && h.category.length === 0) {
        lines.push("- Category was stored empty.");
      } else if (category) {
        lines.push(`- **Category:** ${category}`);
      }

      if (h.disposition === null || h.disposition === undefined) {
        lines.push("- Disposition was not stored.");
      } else if (typeof h.disposition === "string" && h.disposition.length === 0) {
        lines.push("- Disposition was stored empty.");
      } else if (typeof h.disposition === "string") {
        lines.push(`- **Disposition:** ${disposition ?? ""}`);
      }

      if (h.rationale === null || h.rationale === undefined) {
        lines.push("- Rationale was not stored.");
      } else if (typeof h.rationale === "string" && h.rationale.length === 0) {
        lines.push("- Rationale was stored empty.");
      } else if (rationale) {
        lines.push("");
        lines.push(rationale);
      }

      lines.push("");
    }
  }

  lines.push("## Security model");
  lines.push("");

  const warnings = Array.isArray(m.warnings) ? m.warnings : [];

  if (m.warnings === null || m.warnings === undefined) {
    lines.push("Warnings were not stored.");
    lines.push("");
  } else if (warnings.length === 0) {
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
