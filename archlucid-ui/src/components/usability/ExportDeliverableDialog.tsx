"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { SponsorExportSendHonestyStrip } from "@/components/exports/SponsorExportSendHonestyStrip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { whyDisabledNeedsPrerequisite } from "@/lib/why-disabled-cta";
import {
  parseReviewDeliverableAudienceFromSearch,
  parseReviewDeliverableOpenFromSearch,
  type ReviewDeliverableAudience,
  reviewExportDeliverablePanelsHrefFromSearch,
} from "@/lib/reviews/review-export-deliverable-panels-url";

type ExportDeliverableDialogProps = {
  readonly runId: string;
  readonly manifestId?: string | null;
};

const AUDIENCE_OPTIONS: readonly { id: ReviewDeliverableAudience; label: string; description: string }[] = [
  { id: "sponsor", label: "Sponsor report", description: "Sponsor-safe PDF with outcomes and risk posture." },
  { id: "grc", label: "GRC diligence bundle", description: "Audit trail excerpts, findings, and policy references." },
  { id: "board", label: "Board packet", description: "Condensed narrative for governance committees." },
];

/** Unified export/deliverable picker for post-commit reviews. */
export function ExportDeliverableDialog(props: ExportDeliverableDialogProps) {
  const pathname = usePathname() ?? `/architecture/reviews/${props.runId}`;
  const [open, setOpenState] = useState(() =>
    parseReviewDeliverableOpenFromSearch(
      typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("deliverableOpen"),
    ),
  );
  const [audience, setAudienceState] = useState<ReviewDeliverableAudience>(() => {
    const parsed = parseReviewDeliverableAudienceFromSearch(
      typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("deliverableAudience"),
    );

    return parsed ?? "sponsor";
  });
  const openRef = useRef(open);
  openRef.current = open;
  const audienceRef = useRef(audience);
  audienceRef.current = audience;
  const encodedRun = encodeURIComponent(props.runId);
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: props.runId,
    manifestVersion: props.manifestId ?? null,
  });
  const deliverableDisabledReason =
    sealedManifestBlockedReason === null ? null : whyDisabledNeedsPrerequisite(sealedManifestBlockedReason);
  const blockedHintId = "export-deliverable-blocked-hint";

  const syncDeliverablePanelsToUrl = useCallback(
    (nextOpen: boolean, nextAudience: ReviewDeliverableAudience) => {
      commitHrefIfChanged(
        reviewExportDeliverablePanelsHrefFromSearch(
          readWindowLocationSearch(),
          { open: nextOpen, audience: nextOpen ? nextAudience : null },
          pathname,
        ),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (openRef.current === next) {
          return current;
        }

        openRef.current = next;
        syncDeliverablePanelsToUrl(next, audienceRef.current);

        return next;
      });
    },
    [syncDeliverablePanelsToUrl],
  );

  const setAudience = useCallback(
    (nextAudience: ReviewDeliverableAudience) => {
      if (audienceRef.current === nextAudience) {
        return;
      }

      audienceRef.current = nextAudience;
      setAudienceState(nextAudience);

      if (openRef.current) {
        syncDeliverablePanelsToUrl(true, nextAudience);
      }
    },
    [syncDeliverablePanelsToUrl],
  );

  useEffect(() => {
    const syncDeliverablePanelsFromUrl = (): void => {
      const params = new URLSearchParams(window.location.search);
      const nextOpen = parseReviewDeliverableOpenFromSearch(params.get("deliverableOpen"));
      const parsedAudience = parseReviewDeliverableAudienceFromSearch(params.get("deliverableAudience"));
      const nextAudience = parsedAudience ?? audienceRef.current;

      if (openRef.current !== nextOpen) {
        openRef.current = nextOpen;
        setOpenState(nextOpen);
      }

      if (parsedAudience !== null && audienceRef.current !== nextAudience) {
        audienceRef.current = nextAudience;
        setAudienceState(nextAudience);
      }
    };

    syncDeliverablePanelsFromUrl();
    window.addEventListener("popstate", syncDeliverablePanelsFromUrl);

    return () => {
      window.removeEventListener("popstate", syncDeliverablePanelsFromUrl);
    };
  }, []);

  const exportHref =
    audience === "sponsor"
      ? `${SPONSOR_REPORT_PATH}?runId=${encodedRun}`
      : audience === "grc"
        ? auditTrailNavHref(props.runId)
        : `${SPONSOR_DASHBOARD_HREF}?runId=${encodedRun}`;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="export-deliverable-trigger"
            disabled={deliverableDisabledReason !== null}
            aria-describedby={deliverableDisabledReason === null ? undefined : blockedHintId}
          >
            Create deliverable
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create deliverable</DialogTitle>
            <DialogDescription>Choose an audience and open the matching export workflow.</DialogDescription>
          </DialogHeader>
          <fieldset className="m-0 space-y-2 border-0 p-0">
            <legend className={cn("mb-2 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>Audience</legend>
            {AUDIENCE_OPTIONS.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
              >
                <input
                  type="radio"
                  name="deliverable-audience"
                  value={option.id}
                  checked={audience === option.id}
                  onChange={() => setAudience(option.id)}
                  className="mt-1"
                />
                <span>
                  <span className={cn("block font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>{option.label}</span>
                  <span className={cn("block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <SponsorExportSendHonestyStrip className="mt-3" testIdPrefix="export-deliverable" />
          <div className="flex justify-end gap-2 pt-2">
            {deliverableDisabledReason === null ? (
              <Button type="button" variant="default" size="sm" asChild>
                <Link href={exportHref}>Open export</Link>
              </Button>
            ) : (
              <Button type="button" variant="default" size="sm" disabled>
                Open export
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <WhyDisabledCtaHint
        id={blockedHintId}
        reason={deliverableDisabledReason}
        testId={blockedHintId}
      />
    </div>
  );
}
