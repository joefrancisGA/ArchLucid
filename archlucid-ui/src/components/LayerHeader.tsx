"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactNode } from "react";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/vocabulary/architecture-review-vocabulary";
import {
  mergeLayerGuidanceForBuyerDemoShell,
  type LayerGuidancePageKey,
} from "@/lib/layer-guidance";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { useNavSurface } from "@/lib/use-nav-surface";

export type LayerHeaderProps = {
  pageKey: LayerGuidancePageKey;
  className?: string;
  /** `compact` drops the accent rail for lighter-weight detail pages */
  density?: "default" | "compact";
  /** When set, wraps guidance in a collapsed `<details>` so primary page actions stay above the fold. */
  collapsibleGuidance?: string;
  /** Optional content below layer guidance inside the collapsible panel (e.g. first-time checklist). */
  collapsibleChildren?: ReactNode;
};

/**
 * Compact route-level reminder of which **buyer layer** the page belongs to (**Pilot** vs **Advanced operations** / **Governance**) and when to use it.
 * Copy lives in **`layer-guidance.ts`** (`LayerGuidancePageKey` per route family). **`useNavSurface()`** composes **Visibility**
 * (this strip + nav tier rules) separately from **Capability** (`useOperateCapability` on each route).
 *
 * **Governance** rows (non-null **`enterpriseFootnote`**): typography matches the governance slice; an **Execute+**
 * rank cue line is composed only when **`callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority`** (**UI only** — API **`[Authorize]`** wins).
 * **Advanced operations** rows omit the footnote and do not show the Execute cue strip here.
 *
 * @see `LayerHeader.test.tsx`
 * @see `authority-seam-regression.test.ts` — **`LAYER_PAGE_GUIDANCE`** Advanced operations vs Governance footnote contract.
 * @see `operate-authority-ui-shaping.test.tsx` — mutation hook → **`disabled`** / **`readOnly`** on representative pages.
 */
export function LayerHeader({
  pageKey,
  className,
  density = "default",
  collapsibleGuidance,
  collapsibleChildren,
}: LayerHeaderProps) {
  const surface = useNavSurface(pageKey);
  const buyerDemoShell = isBuyerPolishedOperatorShellEnv();
  const block = mergeLayerGuidanceForBuyerDemoShell(pageKey, surface.layerGuidance, buyerDemoShell);
  const operateExecuteRankCue = surface.contextHints.layerHeaderEnterpriseRankCue;
  const demoUi = isNextPublicDemoMode();
  const usesOperateGovernanceFootnote =
    block.enterpriseFootnote !== null && block.enterpriseFootnote !== undefined;
  const compact = density === "compact";

  const guidanceBody = (
    <>
      <p
        className={cn(
          "m-0 font-semibold uppercase tracking-wide",
          compact
            ? (cn("text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.badge))
            : (cn("text-teal-900 dark:text-teal-200", OPERATOR_TYPOGRAPHY.helper)),
        )}
      >
        {block.layerBadge}
      </p>
      <p className={cn("m-0 mt-0.5 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{block.headline}</p>
      {!block.omitReviewPackageScopeHelp ? (
        <p
          className={cn("m-0 mt-1.5 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="layer-header-review-vocabulary"
          title={ARCHITECTURE_REVIEW_VOCABULARY.buyerReviewPackageScopeHelp}
        >
          <>
            <InlineGuidanceLabel label="Review and evidence trail:" />{" "}
            {ARCHITECTURE_REVIEW_VOCABULARY.buyerReviewPackageScopeHelp}
          </>
        </p>
      ) : null}
      <p
        className={cn(
          "m-0 mt-1 leading-snug",
          usesOperateGovernanceFootnote
            ? compact
              ? (cn("text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper))
              : (cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper))
            : (cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)),
        )}
      >
        {block.useWhen}
      </p>
      {!compact && block.firstPilotNote ? (
        <p className={cn("m-0 mt-1.5 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          <InlineGuidanceText text={block.firstPilotNote} />
        </p>
      ) : null}
      {block.enterpriseFootnote ? (
        <p className={cn("m-0 mt-1.5 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          {block.enterpriseFootnote}
        </p>
      ) : null}
      {operateExecuteRankCue && !demoUi ? (
        <p
          className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="layer-header-operate-execute-rank-cue"
          role="note"
        >
          {operateExecuteRankCue}
        </p>
      ) : null}
    </>
  );

  const guidanceAside = (
    <aside
      className={cn(
        !className &&
          (compact
            ? cn("max-w-3xl rounded-md bg-neutral-100/70 py-2 pl-0 dark:bg-neutral-900/60", OPERATOR_TYPOGRAPHY.helper)
            : "mb-4 max-w-3xl border-l-4 border-teal-700 py-1 pl-3 dark:border-teal-500"),
        collapsibleGuidance ? "mb-0" : null,
        className,
      )}
      aria-label={`${block.layerBadge}: ${block.headline}`}
    >
      {guidanceBody}
    </aside>
  );

  if (collapsibleGuidance !== undefined && collapsibleGuidance.trim().length > 0) {
    return (
      <details
        className={cn("mb-4 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="layer-header-collapsible-guidance"
      >
        <summary className={cn("cursor-pointer font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          {collapsibleGuidance}
        </summary>
        <div className="mt-3">
          {guidanceAside}
          {collapsibleChildren ? (
            <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">{collapsibleChildren}</div>
          ) : null}
        </div>
      </details>
    );
  }

  return guidanceAside;
}
