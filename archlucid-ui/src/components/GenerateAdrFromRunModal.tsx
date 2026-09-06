"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FileDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { useProductionDeskChrome } from "@/hooks/useProductionDeskChrome";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { BUYER_VIEW_SIGNED_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  CAREER_EXPORT_EVAL_SAMPLE_LABEL,
  CAREER_EXPORT_EVAL_SAMPLE_MAX_FINDINGS,
  CAREER_EXPORT_INCOMPLETE_CONFIRM_LABEL,
  capAdrGeneratorFindingsForExport,
  formatCareerExportFindingInventoryLine,
  resolveCareerExportFindingInventory,
  resolveCareerExportMaxFindings,
} from "@/lib/career-export-finding-inventory";
import { formatCareerExportHonestyMarkdown, resolveCareerExportCoverageHonesty } from "@/lib/career-export-coverage-honesty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { buildMadrMarkdownFromRun, type AdrGeneratorRunInput } from "@/lib/adr-from-run";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import {
  parseReviewGenerateAdrOpenFromSearch,
  reviewGenerateAdrPanelsHrefFromSearch,
} from "@/lib/reviews/review-generate-adr-panels-url";

export type GenerateAdrFromRunModalProps = {
  input: AdrGeneratorRunInput;
  /** Total findings on the review before any export cap (DA-11). */
  totalFindingCount?: number;
  /** Distinct engines that produced findings on this package snapshot (PC-01). */
  enginesSucceeded?: number | null;
  /** Buyer-polished review detail: soften ADR jargon into decision-record language. */
  buyerPolished?: boolean;
};

/**
 * Run detail action: drafts a MADR-style ADR in-browser from serialized run + explanation payload (no extra HTTP).
 */
export function GenerateAdrFromRunModal({
  input,
  totalFindingCount,
  enginesSucceeded = null,
  buyerPolished = false,
}: GenerateAdrFromRunModalProps) {
  const workingDesk = useProductionDeskChrome();
  const healthQuery = useHealthReadySummaryQuery({ enabled: workingDesk });
  const preCommitGateEnabled = healthQuery.data?.preCommitGateEnabled ?? null;
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${input.runId}`;
  const searchParams = useSearchParams();
  const adrOpenParam = searchParams.get("adrOpen");
  const [open, setOpenState] = useState(() => parseReviewGenerateAdrOpenFromSearch(adrOpenParam));
  const [markdown, setMarkdown] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [incompleteExportConfirmed, setIncompleteExportConfirmed] = useState(false);
  const evalSampleExport = buyerPolished && !workingDesk;
  const exportMaxFindings = resolveCareerExportMaxFindings({
    workingDesk,
    evalSampleExport,
  });
  const totalEligibleFindings = totalFindingCount ?? input.findings.length;
  const exportInput = capAdrGeneratorFindingsForExport(input, exportMaxFindings);
  const exportInventory = resolveCareerExportFindingInventory({
    included: exportInput.findings.length,
    total: totalEligibleFindings,
  });
  const exportInventoryLine = formatCareerExportFindingInventoryLine(exportInventory);
  const coverageHonesty = resolveCareerExportCoverageHonesty({
    runId: input.runId,
    progressSummary: null,
    manifestSummary: null,
    graphSnapshot: null,
    enginesSucceeded,
    workingDesk,
    preCommitGateEnabled,
  });
  const exportBlocked =
    (workingDesk && !exportInventory.isComplete && !incompleteExportConfirmed)
    || (coverageHonesty.blockedForWorkingCareerExport && !incompleteExportConfirmed);

  const buildExportMarkdown = useCallback(
    (exportInput: AdrGeneratorRunInput): string => {
      const careerExportHonestyMarkdown = workingDesk
        ? formatCareerExportHonestyMarkdown({
            runId: input.runId,
            progressSummary: null,
            manifestSummary: null,
            graphSnapshot: null,
            enginesSucceeded,
            workingDesk: true,
            preCommitGateEnabled,
          })
        : null;

      return buildMadrMarkdownFromRun(exportInput, { careerExportHonestyMarkdown });
    },
    [enginesSucceeded, input.runId, preCommitGateEnabled, workingDesk],
  );

  const seedFromInput = useCallback(() => {
    setMarkdown(buildExportMarkdown(exportInput));
  }, [buildExportMarkdown, exportInput]);

  const syncAdrOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      router.replace(reviewGenerateAdrPanelsHrefFromSearch(searchParams.toString(), nextOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncAdrOpenToUrl(next);

        return next;
      });
    },
    [syncAdrOpenToUrl],
  );

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);

      if (next) {
        seedFromInput();
        setCopied(false);
        setCopyError(null);
        setIncompleteExportConfirmed(false);
      }
    },
    [seedFromInput],
  );

  const onCopy = useCallback(async () => {
    if (exportBlocked) {
      return;
    }

    const blockedReason = runCollateralSealedManifestCopyBlockedReason({
      runId: input.runId,
      manifestVersion: input.manifestStatusLabel,
    });

    if (blockedReason !== null) {
      setCopyError(blockedReason);
      return;
    }

    setCopyError(null);

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2_000);
    } catch {
      setCopyError("Clipboard unavailable — select the Markdown above and copy manually.");
    }
  }, [exportBlocked, input.manifestStatusLabel, input.runId, markdown]);

  const onDownload = useCallback(() => {
    if (exportBlocked) {
      return;
    }

    const blockedReason = runCollateralSealedManifestCopyBlockedReason({
      runId: input.runId,
      manifestVersion: input.manifestStatusLabel,
    });

    if (blockedReason !== null) {
      setCopyError(blockedReason);
      return;
    }

    setCopyError(null);

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `adr-archlucid-${input.runId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportBlocked, input.manifestStatusLabel, input.runId, markdown]);

  return (
    <>
      <Button type="button" variant="outline" data-testid="generate-adr-button" onClick={() => onOpenChange(true)}>
        {buyerPolished ? BUYER_VIEW_SIGNED_RECORD_CTA : "Generate ADR"}
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[min(90vh,56rem)] max-w-3xl gap-4 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{buyerPolished ? "Decision record draft" : "Architecture Decision Record"}</DialogTitle>
            <DialogDescription>
              {evalSampleExport
                ? `${CAREER_EXPORT_EVAL_SAMPLE_LABEL}. MADR-style draft you can copy into your enterprise decision-register or CAB packet.`
                : buyerPolished
                  ? "MADR-style draft you can copy into your enterprise decision-register or CAB packet. Edit the Markdown, then copy or download — nothing is stored server-side."
                  : "MADR-inspired draft from this review's findings and aggregate AI assessment. Edit the Markdown, then copy or download — nothing is stored server-side."}
            </DialogDescription>
          </DialogHeader>
          {exportInventoryLine !== null ? (
            <p
              className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="generate-adr-export-inventory-line"
              role="status"
            >
              {exportInventoryLine}
            </p>
          ) : null}
          {workingDesk ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="generate-adr-measurement-floor-line"
              role="status"
            >
              {coverageHonesty.measurementFloor.line}
            </p>
          ) : null}
          {evalSampleExport ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="generate-adr-eval-sample-label">
              Includes up to {CAREER_EXPORT_EVAL_SAMPLE_MAX_FINDINGS} findings in this sample export.
            </p>
          ) : null}
          {exportBlocked ? (
            <Button
              type="button"
              variant="outline"
              data-testid="generate-adr-export-incomplete-confirm"
              onClick={() => {
                setIncompleteExportConfirmed(true);
              }}
            >
              {CAREER_EXPORT_INCOMPLETE_CONFIRM_LABEL}
            </Button>
          ) : null}
          <div className="space-y-2">
            <label className={cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)} htmlFor="adr-markdown-editor">
              Markdown
            </label>
            <Textarea
              id="adr-markdown-editor"
              value={markdown}
              onChange={(e) => {
                setMarkdown(e.target.value);
              }}
              spellCheck={false}
              className={cn("min-h-[14rem] font-mono leading-relaxed md:min-h-[18rem]", OPERATOR_TYPOGRAPHY.micro, (cn("md:font-normal md:leading-5 md:", OPERATOR_TYPOGRAPHY.helper)))}
              aria-label="Architecture decision record markdown"
            />
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-2">
            <Button type="button" variant="outline" onClick={seedFromInput} title="Discard edits and rebuild from run data">
              Reset to template
            </Button>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={exportBlocked}
                onClick={() => {
                  void onCopy();
                }}
              >
                {copied ? "Copied" : "Copy to clipboard"}
              </Button>
              <Button type="button" variant="default" disabled={exportBlocked} onClick={onDownload}>
                <FileDown className="mr-2 size-4" aria-hidden />
                Download .md
              </Button>
            </div>
            {copyError !== null ? (
              <p
                role="alert"
                className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="generate-adr-copy-error"
              >
                {copyError}
              </p>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
