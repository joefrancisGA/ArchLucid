"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";

import { HelpDrawerContent } from "@/components/help/HelpDrawerContent";
import { GovernanceFindingDetailPane } from "@/components/governance/findings/GovernanceFindingDetailPane";
import { FindingDispositionRestoreButton } from "@/components/governance/findings/FindingDispositionRestoreButton";
import { FindingDispositionRecordCorrectionControl } from "@/components/governance/findings/FindingDispositionRecordCorrectionControl";
import { governanceFindingInspectHref } from "@/components/governance/findings/governance-findings-navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SeverityTag } from "@/components/ui/severity-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export type GovernanceFindingTriagePanelProps = {
  readonly open: boolean;
  readonly row: GovernanceFindingQueueRow | null;
  readonly activeIndex: number;
  readonly totalCount: number;
  readonly buyerPolishedShell: boolean;
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onRowOpened?: (row: GovernanceFindingQueueRow) => void;
};

/** Non-modal side panel so architects can triage findings without leaving the queue list. */
export function GovernanceFindingTriagePanel(props: GovernanceFindingTriagePanelProps): ReactElement | null {
  const {
    open,
    row,
    activeIndex,
    totalCount,
    buyerPolishedShell,
    canGoPrevious,
    canGoNext,
    onOpenChange,
    onPrevious,
    onNext,
    onRowOpened,
  } = props;

  if (row === null) {
    return null;
  }

  const inspectHref = governanceFindingInspectHref(row.runId, row.findingId);
  const positionLabel = `${activeIndex + 1} of ${totalCount}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <HelpDrawerContent
        modal={false}
        className="z-[52]"
        data-testid="governance-finding-triage-panel"
        aria-describedby="governance-finding-triage-panel-description"
        onOpenAutoFocus={() => {
          onRowOpened?.(row);
        }}
      >
        <DialogHeader className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <DialogTitle className={cn("text-left text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            Finding triage
          </DialogTitle>
          <p
            id="governance-finding-triage-panel-description"
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          >
            Stay in the queue while you review evidence. Use previous and next to move through findings ({positionLabel}).
          </p>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canGoPrevious}
                onClick={onPrevious}
                data-testid="governance-finding-triage-previous"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canGoNext}
                onClick={onNext}
                data-testid="governance-finding-triage-next"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{positionLabel}</span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityTag severity={row.severity} />
              <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{row.title}</span>
            </div>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{row.recommended}</p>
          </div>

          <GovernanceFindingDetailPane
            row={row}
            buyerPolishedShell={buyerPolishedShell}
            variant="operational"
          />

          <FindingDispositionRestoreButton findingId={row.findingId} runId={row.runId} />

          {row.latestDisposition !== null && row.latestDisposition !== undefined && row.latestDisposition.trim().length > 0 ? (
            <FindingDispositionRecordCorrectionControl
              findingId={row.findingId}
              runId={row.runId}
              hasRecordedDisposition={true}
              testId="governance-finding-triage-record-correction"
            />
          ) : null}

          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <Link className={OPERATOR_LINK.inline} href={inspectHref} data-testid="governance-finding-triage-open-full">
              Open full evidence trace →
            </Link>
          </p>
        </div>
      </HelpDrawerContent>
    </Dialog>
  );
}
