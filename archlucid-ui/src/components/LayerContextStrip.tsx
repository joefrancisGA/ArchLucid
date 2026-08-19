import { cn } from "@/lib/utils";
import {
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import Link from "next/link";
import type { ReactNode } from "react";

import type { ResolvedBuyerGoldenJourneyNav } from "@/lib/buyer/buyer-golden-journey-nav";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import { type LayerId } from "@/lib/getLayerForRoute";

const layerStripBase =
  "border-b border-neutral-200 bg-al-surface-raised border-l-4 dark:border-neutral-800";

const LAYER_COPY: Record<LayerId, { label: string; question: string; strip: string; labelClass: string }> = {
  pilot: {
    label: "Reviews",
    question: "Finalized packages with findings, evidence, decisions, and audit trail.",
    strip: `${layerStripBase} border-l-blue-600`,
    labelClass: "text-al-text-primary",
  },
  "operate-analysis": {
    label: "Advanced operations",
    question: "What changed, why, and what does the architecture look like?",
    strip: `${layerStripBase} border-l-[var(--al-accent-interactive)]`,
    labelClass: "text-al-text-primary",
  },
  "operate-governance": {
    label: "Governance",
    question: "How do we govern, audit, and operationalize architecture decisions?",
    strip: `${layerStripBase} border-l-amber-600`,
    labelClass: "text-al-text-primary",
  },
  "operator-admin": {
    label: "Admin",
    question: "How do we configure the tenant, cost visibility, and access for this workspace?",
    strip: `${layerStripBase} border-l-violet-600`,
    labelClass: "text-al-text-primary",
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
  /** CTO demo pack: sample/live data indicator on golden-journey spine pages. */
  demoDataSourceBadge?: ReactNode;
  /** When true, omit contextual return links on this route (breadcrumbs + sidebar nav suffice). */
  hideOperateBackLink?: boolean;
};

type BuyerGoldenJourneyStepperNavProps = {
  readonly nav: ResolvedBuyerGoldenJourneyNav;
  readonly demoDataSourceBadge?: ReactNode;
};

function buyerGoldenJourneyStepChipClass(options: { readonly done: boolean; readonly current: boolean }): string {
  if (options.done) {
    return "border border-emerald-700/40 bg-[var(--al-status-ready-bg)] text-[var(--al-status-ready-fg)]";
  }

  if (options.current) {
    return cn(
      "border border-neutral-200 border-l-2 border-l-[var(--al-accent-interactive)] bg-al-surface-raised text-al-text-primary font-semibold shadow-sm ring-2 ring-[var(--al-accent-border-focus)]/40 dark:border-neutral-800",
    );
  }

  return "border border-neutral-200 bg-al-surface-raised text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200";
}

function BuyerGoldenJourneyStepperNav(props: BuyerGoldenJourneyStepperNavProps): React.JSX.Element {
  const { nav, demoDataSourceBadge } = props;

  return (
    <nav
      aria-label="Review journey steps"
      className="flex flex-col gap-2 border-t border-neutral-200/70 pt-1.5 dark:border-neutral-700/80"
      data-testid="buyer-golden-journey-stepper"
    >
      {nav.currentStepIndex !== null ? (
        <div className="flex flex-wrap items-center gap-2">
          <ol
            className="m-0 flex list-none flex-wrap gap-1.5 p-0"
            aria-label="Review journey step indicators"
            data-testid="buyer-golden-journey-step-indicators"
          >
            {BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.map((def, idx) => {
              const cur = nav.currentStepIndex;
              const done = cur !== null && idx < cur;
              const current = cur !== null && idx === cur;

              const chipClass = buyerGoldenJourneyStepChipClass({ done, current });

              const chipInner = (
                <>
                  <span className="tabular-nums">{def.step}.</span>
                  <span>{def.label}</span>
                </>
              );

              return (
                <li key={`${def.step}-${def.href}`}>
                  {current ? (
                    <span
                      aria-current="step"
                      aria-label={`Step ${def.step}: ${def.label}. ${def.chipTooltip}`}
                      className={cn(
                        "inline-flex min-h-7 items-center gap-1 rounded-full px-2 py-0.5 font-medium transition",
                        OPERATOR_TYPOGRAPHY.badge,
                        chipClass,
                      )}
                    >
                      {chipInner}
                    </span>
                  ) : (
                    <Link
                      href={def.href}
                      aria-label={`Step ${def.step}: ${def.label}. ${def.chipTooltip}`}
                      prefetch
                      className={cn(
                        "inline-flex min-h-7 items-center gap-1 rounded-full px-2 py-0.5 font-medium no-underline transition hover:opacity-95",
                        OPERATOR_TYPOGRAPHY.badge,
                        chipClass,
                      )}
                    >
                      {chipInner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
          {demoDataSourceBadge}
        </div>
      ) : null}
    </nav>
  );
}

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
  demoDataSourceBadge = undefined,
  hideOperateBackLink = false,
}: LayerContextStripProps) {
  const orientation = buyerRouteOrientation;

  const resolveStripBackLink = (): { label: string; href: string } | null => {
    if (hideOperateBackLink) {
      return null;
    }

    if (buyerOperateBackLink !== null && buyerOperateBackLink !== undefined) {
      return buyerOperateBackLink;
    }

    return null;
  };

  if (orientation !== undefined && orientation.line.trim().length > 0 && orientation.label.trim().length > 0) {
    const baseStrip = LAYER_COPY[layerId];
    const stripBack = resolveStripBackLink();

    return (
      <div
        aria-labelledby="operator-layer-context-text"
        className={cn("min-h-9 w-full", baseStrip.strip, className)}
        data-layer-context-strip=""
        data-testid="layer-context-strip"
        role="region"
      >
        <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, OPERATOR_SHELL_CONTENT_PADDING_X_CLASS, (cn("flex min-h-9 w-full flex-col gap-1 py-1.5 font-normal leading-tight text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)))}>
          <div className="flex h-full min-h-9 flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className={cn("m-0 min-w-0 flex-1", OPERATOR_TYPOGRAPHY.body)} id="operator-layer-context-text">
              <span className={cn("font-medium", baseStrip.labelClass)}>{orientation.label}</span>
              <span className="text-neutral-500 dark:text-neutral-400" aria-hidden>
                {" "}
                —{" "}
              </span>
              <span className="font-normal text-neutral-800 dark:text-neutral-200">{orientation.line}</span>
            </p>
            {stripBack !== null ? (
              <Link
                className={cn("shrink-0 font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-2 transition hover:text-neutral-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-1 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
                data-testid="layer-context-back-pilot"
                href={stripBack.href}
                prefetch
              >
                {stripBack.label}
              </Link>
            ) : null}
          </div>
          {buyerGoldenJourneyNav !== null && buyerGoldenJourneyNav !== undefined ? (
            <BuyerGoldenJourneyStepperNav nav={buyerGoldenJourneyNav} demoDataSourceBadge={demoDataSourceBadge} />
          ) : null}
        </div>
      </div>
    );
  }

  if (buyerGoldenJourneyNav !== null && buyerGoldenJourneyNav !== undefined) {
    const baseStrip = LAYER_COPY[layerId];

    return (
      <div
        aria-label="Review journey steps"
        className={cn("min-h-9 w-full", baseStrip.strip, className)}
        data-layer-context-strip=""
        data-testid="layer-context-strip"
        role="region"
      >
        <div
          className={cn(
            OPERATOR_SHELL_MAX_WIDTH_CLASS,
            OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
            cn(
              "flex min-h-9 w-full flex-col gap-1 py-1.5 font-normal leading-tight text-neutral-800 dark:text-neutral-200",
              OPERATOR_TYPOGRAPHY.body,
            ),
          )}
        >
          <BuyerGoldenJourneyStepperNav nav={buyerGoldenJourneyNav} demoDataSourceBadge={demoDataSourceBadge} />
        </div>
      </div>
    );
  }

  const baseCopy = LAYER_COPY[layerId];
  const copy =
    layerId === "operate-analysis" && polishedOperateAnalysisLabel !== undefined && polishedOperateAnalysisLabel.length > 0
      ? { ...baseCopy, label: polishedOperateAnalysisLabel }
      : baseCopy;
  const stripBack = resolveStripBackLink();

  const compactRegionLabel = `${copy.label}. ${copy.question}`;

  return (
    <div
      aria-label={compactRegionLabel}
      className={cn("min-h-9 w-full", copy.strip, className)}
      data-layer-context-strip=""
      data-testid="layer-context-strip"
      role="region"
    >
      <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, OPERATOR_SHELL_CONTENT_PADDING_X_CLASS, (cn("flex h-full min-h-9 flex-wrap items-center gap-x-2 gap-y-0.5 py-1.5 font-normal leading-tight text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)))}>
        <p className={cn("m-0 min-w-0 flex-1", OPERATOR_TYPOGRAPHY.body)} id="operator-layer-context-text">
          <span className={cn("font-medium", copy.labelClass)}>{copy.label}</span>
        </p>
        {stripBack !== null ? (
          <Link
            className={cn("shrink-0 font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-2 transition hover:text-neutral-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-1 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
            data-testid="layer-context-back-pilot"
            href={stripBack.href}
            prefetch
          >
            {stripBack.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
