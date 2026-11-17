import type { ArchLucidOpenGateReturnRecord } from "@/lib/architecture/archlucid-open-gate-return-storage";
import {
  FIRST_REVIEW_OPEN_GATE_STARTER_HREF,
  FIRST_REVIEW_OPEN_GATE_STARTER_LEAD,
} from "@/lib/architecture/first-review-open-gate-starter-copy";
import {
  FIRST_REVIEW_GUIDE_PATH,
  FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID,
} from "@/lib/first-review-guide-route";
import { formatRelativeTime } from "@/lib/relative-time";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { markSecureNowReturnHomeRecommendedFirst } from "@/lib/product-line/securenow-stickiness";

export const ARCHLUCID_RETURN_HOME_WALKTHROUGH_HREF =
  `${FIRST_REVIEW_GUIDE_PATH}#${FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID}` as const;

export const ARCHLUCID_RETURN_HOME_WALKTHROUGH_SUMMARY =
  "Continue the first-review walkthrough. The sample is not your sealed tenant review." as const;

export function buildArchLucidOpenGateReturnHomeRows(
  record: ArchLucidOpenGateReturnRecord | null,
): readonly SecureNowHomeDestinationRow[] {
  if (record === null) {
    return [
      {
        href: ARCHLUCID_RETURN_HOME_WALKTHROUGH_HREF,
        label: "First-review walkthrough",
        summary: ARCHLUCID_RETURN_HOME_WALKTHROUGH_SUMMARY,
      },
      {
        href: FIRST_REVIEW_OPEN_GATE_STARTER_HREF,
        label: "Sample first-review open gate",
        summary: FIRST_REVIEW_OPEN_GATE_STARTER_LEAD,
      },
    ];
  }

  const findingSegment =
    record.findingId !== null && record.findingId !== undefined && record.findingId.trim().length > 0
      ? ` Top finding ${record.findingId.trim()}.`
      : "";

  return [
    {
      href: record.href,
      label: `Open gate: ${record.openGateLabel}`,
      summary: `Last stored open gate on review ${record.runId} (${formatRelativeTime(record.recordedAtUtc)}).${findingSegment} Browser-local — not a usage score.`,
    },
    {
      href: FIRST_REVIEW_OPEN_GATE_STARTER_HREF,
      label: "Sample first-review open gate",
      summary: FIRST_REVIEW_OPEN_GATE_STARTER_LEAD,
    },
  ];
}

export function resolveArchLucidOpenGateReturnHomePrimaryHref(
  record: ArchLucidOpenGateReturnRecord | null,
): string {
  if (record !== null) {
    return record.href;
  }

  return ARCHLUCID_RETURN_HOME_WALKTHROUGH_HREF;
}

export function buildArchLucidOpenGateReturnHomeRowsWithRecommendedFirst(
  record: ArchLucidOpenGateReturnRecord | null,
): readonly SecureNowHomeDestinationRow[] {
  const rows = buildArchLucidOpenGateReturnHomeRows(record);

  return markSecureNowReturnHomeRecommendedFirst(rows, resolveArchLucidOpenGateReturnHomePrimaryHref(record));
}
