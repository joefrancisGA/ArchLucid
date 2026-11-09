"use client";

import { useEffect, useState } from "react";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import {
  readArchLucidOpenGateReturnRecord,
} from "@/lib/architecture/archlucid-open-gate-return-storage";
import { formatRelativeTime } from "@/lib/relative-time";
import { FIRST_REVIEW_OPEN_GATE_STARTER_HREF, FIRST_REVIEW_OPEN_GATE_STARTER_LEAD } from "@/lib/architecture/first-review-open-gate-starter-copy";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

const SECTION_HEADING = "Continue review" as const;

/** Architecture home — last review that still had an open gate (browser-local). */
export function ArchLucidOpenGateReturnHomeSection(): React.JSX.Element | null {
  const scope = useOperatorScopeQueryKey();
  const [ready, setReady] = useState(false);
  const [record, setRecord] = useState(() => readArchLucidOpenGateReturnRecord(scope.workspaceId));

  useEffect(() => {
    setReady(true);
    setRecord(readArchLucidOpenGateReturnRecord(scope.workspaceId));
  }, [scope.workspaceId]);

  if (!ready) {
    return null;
  }

  const rows: readonly SecureNowHomeDestinationRow[] = record === null
    ? [
        {
          href: FIRST_REVIEW_OPEN_GATE_STARTER_HREF,
          label: "Sample first-review open gate",
          summary: FIRST_REVIEW_OPEN_GATE_STARTER_LEAD,
          recommendedFirst: true,
        },
      ]
    : [
        {
          href: record.href,
          label: `Open gate: ${record.openGateLabel}`,
          summary: ((): string => {
            const relativeRecorded = formatRelativeTime(record.recordedAtUtc);
            const findingSegment =
              record.findingId !== null
              && record.findingId !== undefined
              && record.findingId.trim().length > 0
                ? ` Top finding ${record.findingId.trim()}.`
                : "";

            return `Last stored open gate on review ${record.runId} (${relativeRecorded}).${findingSegment} Browser-local — not a usage score.`;
          })(),
          recommendedFirst: true,
        },
        {
          href: FIRST_REVIEW_OPEN_GATE_STARTER_HREF,
          label: "Sample first-review open gate",
          summary: FIRST_REVIEW_OPEN_GATE_STARTER_LEAD,
        },
      ];

  return (
    <SecureNowHomeDestinationSection
      heading={SECTION_HEADING}
      lead="Resume the last open gate or open the curated sample spine. Not certification."
      rows={rows}
      sectionTestId="archlucid-open-gate-return-home-section"
      headingId="archlucid-open-gate-return-home-heading"
      tableAriaLabel="Architecture open-gate return links"
      linkTestIdPrefix="archlucid-open-gate-return-home-link"
    />
  );
}
