"use client";

import { cn } from "@/lib/utils";
import { useMemo, type ReactElement } from "react";

import {
  RunStoredEvidencePreviewDialog,
  StoredEvidenceFileCells,
  useStoredEvidenceFileActions,
} from "@/components/runs/StoredEvidenceFileCells";
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
import { useRunStoredEvidenceCatalogQuery } from "@/hooks/use-run-stored-evidence-catalog-query";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailEvidenceInventoryItem } from "@/lib/runs/run-detail-evidence-inventory";
import { enrichRunDetailEvidenceInventoryWithCatalog } from "@/lib/runs/run-stored-evidence-inventory-enrich";

export type RunDetailEvidenceInventorySectionProps = {
  readonly runId: string;
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

function resolveCatalogContentType(
  item: RunDetailEvidenceInventoryItem,
  catalog: readonly { readonly evidenceItemId: string; readonly contentType?: string }[],
): string | undefined {
  if (item.evidenceItemId === null) {
    return undefined;
  }

  return catalog.find((entry) => entry.evidenceItemId === item.evidenceItemId)?.contentType;
}

function renderSourceCell(
  item: RunDetailEvidenceInventoryItem,
  runId: string,
  catalogContentType: string | undefined,
  handlers: ReturnType<typeof useStoredEvidenceFileActions>["handlers"],
  openButtonRef: ReturnType<typeof useStoredEvidenceFileActions>["openButtonRef"],
): ReactElement {
  if (item.inventoryKind === "stored-file" && item.evidenceItemId !== null) {
    return (
      <StoredEvidenceFileCells
        runId={runId}
        evidenceItemId={item.evidenceItemId}
        fileName={item.sourceName}
        contentType={catalogContentType}
        handlers={handlers}
        openButtonRef={openButtonRef}
      />
    );
  }

  if (item.inventoryKind === "citation") {
    return (
      <div>
        <span className="font-medium text-al-text-primary">{item.sourceName}</span>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Cited — original not stored
        </p>
      </div>
    );
  }

  return <span className="font-medium text-al-text-primary">{item.sourceName}</span>;
}

export function RunDetailEvidenceInventorySection(props: RunDetailEvidenceInventorySectionProps): ReactElement {
  const { catalog } = useRunStoredEvidenceCatalogQuery(props.runId);
  const { preview, closePreview, handlers, openButtonRef } = useStoredEvidenceFileActions(props.runId);
  const displayItems = useMemo(
    () => enrichRunDetailEvidenceInventoryWithCatalog(props.items, catalog),
    [catalog, props.items],
  );
  const startNewReviewVariant = props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary";

  if (displayItems.length === 0) {
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
    <>
      <section id="submitted-evidence-inventory" className="scroll-mt-24" data-testid="run-detail-evidence-inventory">
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Submitted evidence</h3>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Evidence items ingested for this review and how many findings cite each source. Stored files can be opened or
          downloaded — submitted evidence, not the sealed review record.
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
              {displayItems.map((item) => (
                <EnterpriseTableRow key={item.key}>
                  <EnterpriseTableCell>
                    {renderSourceCell(
                      item,
                      props.runId,
                      resolveCatalogContentType(item, catalog),
                      handlers,
                      openButtonRef,
                    )}
                  </EnterpriseTableCell>
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
      <RunStoredEvidencePreviewDialog runId={props.runId} preview={preview} onClose={closePreview} />
    </>
  );
}
