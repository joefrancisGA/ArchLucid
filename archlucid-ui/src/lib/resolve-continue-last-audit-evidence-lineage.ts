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

const DEFAULT_RECENT_LINEAGE_LIMIT = 8;

function lineageTargetKey(target: Pick<ContinueLastAuditEvidenceLineageTarget, "assessmentId" | "snapshotId" | "controlId">): string {
  return `${target.assessmentId.trim()}::${target.snapshotId.trim()}::${target.controlId.trim()}`;
}

function resolveLineageTargetFromEntry(
  entry: { href: string; label: string; visitedAtUtc: string },
  lookupPath: string,
): ContinueLastAuditEvidenceLineageTarget | null {
  const parsed = parseAuditEvidenceControlLineagePath(entry.href);

  if (parsed === null) {
    return null;
  }

  const label = entry.label.trim().length > 0 ? entry.label.trim() : `Control ${parsed.controlId}`;
  const href = buildAuditEvidenceControlLineagePath(
    parsed.assessmentId,
    parsed.snapshotId,
    parsed.controlId,
    lookupPath,
  );

  return {
    href,
    assessmentId: parsed.assessmentId,
    snapshotId: parsed.snapshotId,
    controlId: parsed.controlId,
    label,
    viewedAtUtc: entry.visitedAtUtc,
  };
}

function readRecentAuditEvidenceControlLineageTargets(
  productLine: ProductLineId,
  maxEntries: number,
): readonly ContinueLastAuditEvidenceLineageTarget[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);
    const lookupPath = auditEvidencePathForProductLine(productLine);
    const seenKeys = new Set<string>();
    const targets: ContinueLastAuditEvidenceLineageTarget[] = [];

    for (const entry of state.entries) {
      const target = resolveLineageTargetFromEntry(entry, lookupPath);

      if (target === null) {
        continue;
      }

      const key = lineageTargetKey(target);

      if (seenKeys.has(key)) {
        continue;
      }

      seenKeys.add(key);
      targets.push(target);

      if (targets.length >= maxEntries) {
        break;
      }
    }

    return targets;
  } catch {
    return [];
  }
}

/** Lists recent audit evidence control lineage visits from operator recent views. */
export function listRecentAuditEvidenceLineageTargets(
  productLine: ProductLineId,
  maxEntries: number = DEFAULT_RECENT_LINEAGE_LIMIT,
): readonly ContinueLastAuditEvidenceLineageTarget[] {
  return readRecentAuditEvidenceControlLineageTargets(productLine, maxEntries);
}

/** Resolves the most recent audit evidence control lineage visit from operator recent views. */
export function resolveContinueLastAuditEvidenceLineage(
  productLine: ProductLineId,
): ContinueLastAuditEvidenceLineageTarget | null {
  const [recent] = listRecentAuditEvidenceLineageTargets(productLine, 1);

  return recent ?? null;
}
