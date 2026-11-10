"use client";

import { useEffect, useState } from "react";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { buildArchLucidOpenGateReturnHomeRowsWithRecommendedFirst } from "@/lib/architecture/archlucid-open-gate-return-home-rows";
import {
  readArchLucidOpenGateReturnRecord,
} from "@/lib/architecture/archlucid-open-gate-return-storage";

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

  const rows = buildArchLucidOpenGateReturnHomeRowsWithRecommendedFirst(record);

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
