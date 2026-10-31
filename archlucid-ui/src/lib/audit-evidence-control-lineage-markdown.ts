import type { AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";

const NOT_VERIFIED = "NOT VERIFIED";

function valueOrNotStored(value: string | undefined): string {
  return value?.trim() ? value : "Not stored";
}

function booleanValue(value: boolean | undefined): string {
  return value === undefined ? "Not stored" : value ? "Yes" : "No";
}

function listSection(label: string, values: string[] | undefined): string[] {
  if (!values || values.length === 0) {
    return [`- ${label}: None recorded`];
  }

  return [`- ${label}:`, ...values.map((value) => `  - ${value}`)];
}

export function formatAuditEvidenceControlLineageMarkdown(
  lineage: AuditEvidenceLineageRecord,
): string {
  const associations = lineage.verifiedRemediationAssociations ?? [];
  const incomplete =
    lineage.chainComplete !== true ||
    lineage.readyForPositiveCheckbox !== true ||
    associations.length === 0;
  const status = incomplete ? NOT_VERIFIED : "Ready for human disposition";
  const lines = [
    "> **Scope:** Control evidence excerpt. Not a certification. Not an ATO.",
    "",
    `# Control evidence — ${valueOrNotStored(lineage.controlNumber)}`,
    "",
    `**Status:** ${status}`,
    "",
    "## Control",
    "",
    `- Control number: ${valueOrNotStored(lineage.controlNumber)}`,
    `- Control title: ${valueOrNotStored(lineage.controlTitle)}`,
    `- Assessment ID: ${valueOrNotStored(lineage.assessmentId)}`,
    `- Snapshot ID: ${valueOrNotStored(lineage.auditEvidenceSnapshotId)}`,
    `- Chain complete: ${booleanValue(lineage.chainComplete)}`,
    `- Snapshot hash verified: ${booleanValue(lineage.snapshotHashVerified)}`,
    `- Ready for positive checkbox: ${booleanValue(lineage.readyForPositiveCheckbox)}`,
    "",
    "## Lineage limitations",
    "",
    ...listSection("Broken-link reasons", lineage.brokenLinkReasons),
    "",
    "## Verified remediation associations",
    "",
  ];

  if (associations.length === 0) {
    lines.push("- None recorded.");
  } else {
    for (const association of associations) {
      lines.push(
        `- Association ${valueOrNotStored(association.associationId)}: instance ${valueOrNotStored(association.instanceId)}; status ${valueOrNotStored(association.status)}; verification snapshot ${valueOrNotStored(association.verificationSnapshotId)}; control ${valueOrNotStored(association.controlId)}`,
      );
    }
  }

  lines.push("", "## Latest remediation attempt", "");
  const latest = lineage.latestRemediationAttempt;
  if (latest) {
    lines.push(
      `- Instance ${valueOrNotStored(latest.instanceId)}; status ${valueOrNotStored(latest.status)}; control ${valueOrNotStored(latest.controlId)}; updated ${valueOrNotStored(latest.updatedUtc)}`,
    );
  } else {
    lines.push("- None recorded.");
  }

  lines.push(
    "",
    "This excerpt supports human review. It does not record a disposition, issue a compliance opinion, or claim certification.",
    "",
  );

  return lines.join("\n");
}

export function controlEvidenceMarkdownFileName(controlNumber: string | undefined): string {
  const normalized = (controlNumber?.trim() || "control").replace(/[^a-zA-Z0-9-]+/g, "-");
  return `control-evidence-${normalized.replace(/^-+|-+$/g, "") || "control"}.md`;
}
