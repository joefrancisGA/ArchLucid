import {
  buildAuditEvidenceControlLineagePath,
  parseAuditEvidenceControlLineagePath,
} from "@/lib/audit-evidence-lineage-route";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { auditEvidencePathForProductLine } from "@/lib/product-line/securenow-compliance-routes";

export type ContinueLastAuditEvidenceLineageTarget = {
  readonly href: string;
  readonly assessmentId: string;
  readonly snapshotId: string;
  readonly controlId: string;
  readonly label: string;
  readonly viewedAtUtc: string;
};

function readRecentAuditEvidenceControlLineage(): ContinueLastAuditEvidenceLineageTarget | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const parsed = parseAuditEvidenceControlLineagePath(entry.href);

      if (parsed === null) {
        continue;
      }

      const label =
        entry.label.trim().length > 0 ? entry.label.trim() : `Control ${parsed.controlId}`;

      return {
        href: entry.href,
        assessmentId: parsed.assessmentId,
        snapshotId: parsed.snapshotId,
        controlId: parsed.controlId,
        label,
        viewedAtUtc: entry.visitedAtUtc,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolves the most recent audit evidence control lineage visit from operator recent views. */
export function resolveContinueLastAuditEvidenceLineage(
  productLine: ProductLineId,
): ContinueLastAuditEvidenceLineageTarget | null {
  const recent = readRecentAuditEvidenceControlLineage();

  if (recent === null) {
    return null;
  }

  const lookupPath = auditEvidencePathForProductLine(productLine);
  const href = buildAuditEvidenceControlLineagePath(
    recent.assessmentId,
    recent.snapshotId,
    recent.controlId,
    lookupPath,
  );

  return {
    ...recent,
    href,
  };
}
