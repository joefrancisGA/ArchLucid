import Link from "next/link";

import type { ResolvedBuyerGoldenJourneyNav } from "@/lib/buyer-golden-journey-nav";
import { type LayerId } from "@/lib/getLayerForRoute";
import { cn } from "@/lib/utils";

const LAYER_COPY: Record<LayerId, { label: string; question: string; strip: string; labelClass: string }> = {
  pilot: {
    label: "Architecture reviews",
    question: "Can we produce a credible, evidence-backed review package faster?",
    strip: "bg-blue-50/90 border-b border-blue-200/60 dark:border-blue-900/50 dark:bg-blue-950/30",
    labelClass: "text-blue-900 dark:text-blue-200",
  },
  "operate-analysis": {
    label: "Advanced operations",
    question: "What changed, why, and what does the architecture look like?",
    strip: "bg-teal-50/80 border-b border-teal-200/60 dark:border-teal-900/40 dark:bg-teal-950/30",
    labelClass: "text-teal-900 dark:text-teal-200",
  },
  "operate-governance": {
    label: "Governance",
    question: "How do we govern, audit, and operationalize architecture decisions?",
    strip: "bg-amber-50/80 border-b border-amber-200/60 dark:border-amber-900/40 dark:bg-amber-950/25",
    labelClass: "text-amber-900 dark:text-amber-200",
  },
  "operator-admin": {
    label: "Admin",
    question: "How do we configure the tenant, cost visibility, and access for this workspace?",
    strip: "bg-violet-50/80 border-b border-violet-200/60 dark:border-violet-900/40 dark:bg-violet-950/25",
    labelClass: "text-violet-900 dark:text-violet-200",
  },
};

export type LayerContextStripProps = {
  layerId: LayerId;
  className?: string;
  /** Buyer demo shell: softer label instead of “Advanced operations” on operate-analysis routes. */
  polishedOperateAnalysisLabel?: string;
  /**
   * Buyer-polished shell only: replaces the generic layer question strip with stable page orientation.
   */
  buyerRouteOrientation?: {
    readonly label: string;
    readonly line: string;
  };
  /**
   * Buyer-polished shell: optional satellite-route return link (Operate layers default to Home when omitted).
   */
  buyerOperateBackLink?: {
    readonly label: string;
    readonly href: string;
  } | null;
  /** Buyer-polished shell: previous/next links along the curated Review journey when the route is on that spine. */
  buyerGoldenJourneyNav?: ResolvedBuyerGoldenJourneyNav | null;
};

const DEFAULT_OPERATE_BACK = { label: "Back to home", href: "/" } as const;

/**
 * Persistent one-line product-layer cue under the app header: layer label, guiding question, optional
 * return link on Operate routes. Styling stays subtle (orientation, not a second hero).
 */
export function LayerContextStrip({
  layerId,
  className,
  polishedOperateAnalysisLabel,
  buyerRouteOrientation,
  buyerOperateBackLink = null,
  buyerGoldenJourneyNav = null,
}: LayerContextStripProps) {
  const orientation = buyerRouteOrientation;

  const stripBackForOriented = (isOperateLayer: boolean): { label: string; href: string } | null => {
    if (buyerOperateBackLink !== null && buyerOperateBackLink !== undefined) {
      return buyerOperateBackLink;
    }

    return isOperateLayer ? DEFAULT_OPERATE_BACK : null;
  };

  if (orientation !== undefined && orientation.line.trim().length > 0 && orientation.label.trim().length > 0) {
    const baseStrip = LAYER_COPY[layerId];
    const isOperateOriented =
      layerId === "operate-analysis" || layerId === "operate-governance" || layerId === "operator-admin";
    const stripBack = stripBackForOriented(isOperateOriented);

    return (
      <div
        aria-labelledby="operator-layer-context-text"
        className={cn("min-h-9 w-full", baseStrip.strip, className)}
        data-layer-context-strip=""
        data-testid="layer-context-strip"
        role="region"
      >
        <div className="mx-auto flex min-h-9 w-full max-w-[1600px] flex-col gap-1 px-4 py-1.5 text-sm font-normal leading-tight text-neutral-800 dark:text-neutral-200 lg:px-6">
          <div className="flex h-full min-h-9 flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="m-0 min-w-0 flex-1 text-sm" id="operator-layer-context-text">
              <span className={cn("font-medium", baseStrip.labelClass)}>{orientation.label}</span>
              <span className="text-neutral-500 dark:text-neutral-400" aria-hidden>
                {" "}
                —{" "}
              </span>
              <span className="font-normal text-neutral-800 dark:text-neutral-200">{orientation.line}</span>
            </p>
            {stripBack !== null ? (
              <Link
                className="shrink-0 text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-2 transition hover:text-neutral-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-1 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-neutral-100"
                data-testid="layer-context-back-pilot"
                href={stripBack.href}
              >
                {stripBack.label}
              </Link>
            ) : null}
          </div>
          {buyerGoldenJourneyNav !== null && buyerGoldenJourneyNav !== undefined ? (
            <nav
              aria-label="Review journey steps"
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-200/70 pt-1.5 text-xs dark:border-neutral-700/80"
              data-testid="buyer-golden-journey-stepper"
            >
              {buyerGoldenJourneyNav.prev !== null ? (
                <Link
                  className="shrink-0 font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-950 dark:text-neutral-300 dark:decoration-neutral-600 dark:hover:text-neutral-50"
                  data-testid="buyer-journey-prev"
                  href={buyerGoldenJourneyNav.prev.href}
                >
                  ← {buyerGoldenJourneyNav.prev.label}
                </Link>
              ) : (
                <span className="shrink-0 text-neutral-400 dark:text-neutral-500">← Start</span>
              )}
              <span className="min-w-0 flex-1 text-center font-medium text-neutral-700 dark:text-neutral-300">
                {buyerGoldenJourneyNav.summaryLine}
              </span>
              {buyerGoldenJourneyNav.next !== null ? (
                <Link
                  className="shrink-0 font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-950 dark:text-neutral-300 dark:decoration-neutral-600 dark:hover:text-neutral-50"
                  data-testid="buyer-journey-next"
                  href={buyerGoldenJourneyNav.next.href}
                >
                  {buyerGoldenJourneyNav.next.label} →
                </Link>
              ) : (
                <span className="shrink-0 text-neutral-400 dark:text-neutral-500">End →</span>
              )}
            </nav>
          ) : null}
        </div>
      </div>
    );
  }

  const baseCopy = LAYER_COPY[layerId];
  const copy =
    layerId === "operate-analysis" && polishedOperateAnalysisLabel !== undefined && polishedOperateAnalysisLabel.length > 0
      ? { ...baseCopy, label: polishedOperateAnalysisLabel }
      : baseCopy;
  const isOperate =
    layerId === "operate-analysis" || layerId === "operate-governance" || layerId === "operator-admin";
  const stripBack = stripBackForOriented(isOperate);

  return (
    <div
      aria-labelledby="operator-layer-context-text"
      className={cn("min-h-9 w-full", copy.strip, className)}
      data-layer-context-strip=""
      data-testid="layer-context-strip"
      role="region"
    >
      <div className="mx-auto flex h-full min-h-9 max-w-[1600px] flex-wrap items-center gap-x-2 gap-y-0.5 px-4 py-1.5 text-sm font-normal leading-tight text-neutral-800 dark:text-neutral-200 lg:px-6">
        <p className="m-0 min-w-0 flex-1 text-sm" id="operator-layer-context-text">
          <span className={cn("font-medium", copy.labelClass)}>{copy.label}</span>
          <span className="text-neutral-500 dark:text-neutral-400" aria-hidden>
            {" "}
            —{" "}
          </span>
          <span className="font-normal text-neutral-800 dark:text-neutral-200">{copy.question}</span>
        </p>
        {stripBack !== null ? (
          <Link
            className="shrink-0 text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-2 transition hover:text-neutral-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-1 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-neutral-100"
            data-testid="layer-context-back-pilot"
            href={stripBack.href}
          >
            {stripBack.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
