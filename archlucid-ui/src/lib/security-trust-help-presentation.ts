import type { EnterpriseStatusKind } from "@/components/ui/status-tag";

export function isSecurityTrustHelpTopic(helpTopicSlug: string | undefined): boolean {
  return helpTopicSlug === "security-trust";
}

/** Short StatusTag label for posture-summary table rows. */
export function resolveSecurityTrustPostureStatusTagLabel(statusLabel: string): string {
  const trimmed = statusLabel.trim();

  if (/^self-asserted\b/i.test(trimmed)) {
    return "Self-asserted";
  }

  if (/^planned\b/i.test(trimmed)) {
    return "Planned";
  }

  if (/^active\b/i.test(trimmed)) {
    return "Active";
  }

  if (/^template\b/i.test(trimmed)) {
    return "Template only";
  }

  if (/not issued/i.test(trimmed)) {
    return "Not issued";
  }

  const firstClause = trimmed.split(/[—–]/)[0]?.trim() ?? trimmed;

  return firstClause.length > 48 ? `${firstClause.slice(0, 45)}…` : firstClause;
}

export function mapSecurityTrustPostureStatusToTagKind(statusLabel: string): EnterpriseStatusKind {
  const trimmed = statusLabel.trim().toLowerCase();

  if (trimmed.startsWith("self-asserted")) {
    return "neutral";
  }

  if (trimmed.startsWith("planned")) {
    return "in-progress";
  }

  if (trimmed.startsWith("active")) {
    return "in-progress";
  }

  if (trimmed.startsWith("template")) {
    return "neutral";
  }

  if (trimmed.includes("not issued")) {
    return "needs-attention";
  }

  return "neutral";
}

/** Qualifier text after the StatusTag when the status cell includes an em dash clause. */
export function resolveSecurityTrustPostureStatusQualifier(statusLabel: string): string | null {
  const parts = statusLabel.split(/[—–]/);

  if (parts.length < 2) {
    return null;
  }

  const qualifier = parts.slice(1).join("—").trim();

  return qualifier.length > 0 ? qualifier : null;
}

/** Late-stage buyer-safe rewrites after V1 label stripping and link resolution. */
export function finalizeSecurityTrustHelpPresentation(markdown: string): string {
  return markdown
    .replace(
      /\[scalability and load evidence\]\(#scalability-and-load-evidence\)/gi,
      "[Scalability and load evidence](/help/security-trust#scalability-and-load-evidence)",
    )
    .replace(/\[Assurance Status Canonical\]\(([^)]+)\)/gi, "[SOC 2 readiness roadmap]($1)")
    .replace(/\[Pen Test Summary Procurement Interim\]\(([^)]+)\)/gi, "[Procurement FAQ]($1)")
    .replace(/\[2026 Q2 Owner Conducted\]\(([^)]+)\)/gi, "[Owner-conducted pen-test summary]($1)")
    .replace(/\[2026 Q2 Sow\]\(([^)]+)\)/gi, "[Pen-test SoW template]($1)")
    .replace(/\[Soc2 Status Procurement\]\(([^)]+)\)/gi, "[SOC 2 procurement status]($1)")
    .replace(/\[Remediation Tracker\]\(([^)]+)\)/gi, "[Pen-test remediation tracker]($1)")
    .replace(
      /the http response carries an `etag`[\s\S]*?`304 not modified`\./gi,
      "The pack is regenerated from current repository sources on each download.",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}
