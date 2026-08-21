import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailEvidenceInventoryItem } from "@/lib/runs/run-detail-evidence-inventory";

export type RunDetailEvidenceInventorySectionProps = {
  readonly items: readonly RunDetailEvidenceInventoryItem[];
  /** True when the review record is committed (golden manifest present). */
  readonly hasManifest?: boolean;
  /** When ReviewPackageDoThisNextStrip owns the filled page primary (TB-2175). */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

function formatIngestedLabel(iso: string): string {
  const formatted = formatInstantForLocale(iso);

  return formatted.length > 0 ? formatted : iso;
}

function formatCitingFindingsCount(count: number): string {
  if (count === 0) {
    return "Not cited yet";
  }

  return count === 1 ? "1 finding" : `${count} findings`;
}

export function RunDetailEvidenceInventorySection(props: RunDetailEvidenceInventorySectionProps): ReactElement {
  const { items } = props;
  const startNewReviewVariant = props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary";

  if (items.length === 0) {
    return (
      <section id="submitted-evidence-inventory" className="scroll-mt-24" data-testid="run-detail-evidence-inventory">
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Submitted evidence</h3>
        <div className="mt-3">
          {props.hasManifest === true ? (
            <EnterpriseCompactEmptyState
              title="No submitted source documents are listed"
              description="This finalized review record is locked — source documents cannot be added after finalization. Start a new review to submit updated evidence."
              actions={[{ label: "Start a new review", href: REVIEWS_NEW_PATH, variant: startNewReviewVariant }]}
            />
          ) : (
            <EnterpriseCompactEmptyState
              title="No submitted evidence is listed yet"
              description="Upload supporting files or add architecture context. Findings will cite evidence here after analysis."
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="submitted-evidence-inventory" className="scroll-mt-24" data-testid="run-detail-evidence-inventory">
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Submitted evidence</h3>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Evidence items ingested for this review and how many findings cite each source.
      </p>
      <div className="mt-3">
        <EnterpriseTable ariaLabel="Submitted and cited evidence inventory">
          <EnterpriseTableHead>
            <EnterpriseTableRow>
              <EnterpriseTableHeaderCell scope="col">Source</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col">Kind</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col">Ingested</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col">Cited by</EnterpriseTableHeaderCell>
            </EnterpriseTableRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {items.map((item) => (
              <EnterpriseTableRow key={item.key}>
                <EnterpriseTableCell className="font-medium text-al-text-primary">{item.sourceName}</EnterpriseTableCell>
                <EnterpriseTableCell className="text-al-text-secondary">{item.kind}</EnterpriseTableCell>
                <EnterpriseTableCell className="whitespace-nowrap text-al-text-secondary">
                  {formatIngestedLabel(item.ingestedUtc)}
                </EnterpriseTableCell>
                <EnterpriseTableCell className="tabular-nums text-al-text-secondary">
                  {formatCitingFindingsCount(item.citingFindingCount)}
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      </div>
    </section>
  );
}
