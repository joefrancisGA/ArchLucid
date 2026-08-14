"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TOOLTIP_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  getLoadBearingGlossaryNoun,
  loadBearingGlossaryHelpHref,
  loadBearingGlossarySeenStorageKey,
  type LoadBearingGlossaryNounId,
} from "@/lib/load-bearing-glossary-nouns";
import {
  goldenPathGlossarySeenStorageKey,
  type GoldenPathGlossaryNounId,
} from "@/lib/golden-path-glossary-nouns";

export type InlineGlossaryChipProps = {
  readonly nounId: LoadBearingGlossaryNounId;
  readonly children: React.ReactNode;
  /** When false, skip first-encounter pulse on the term affordance. */
  readonly pulseOnFirstEncounter?: boolean;
};

function resolveSeenStorageKey(nounId: LoadBearingGlossaryNounId): string {
  if (
    nounId === "review-package" ||
    nounId === "evidence-trail" ||
    nounId === "governance-approval" ||
    nounId === "signed-review-record"
  ) {
    return goldenPathGlossarySeenStorageKey(nounId as GoldenPathGlossaryNounId);
  }

  return loadBearingGlossarySeenStorageKey(nounId);
}

/**
 * Inline load-bearing product noun with a dotted underline and short definition tooltip
 * sourced from `customer-glossary-manifest.ts`.
 */
export function InlineGlossaryChip({
  nounId,
  children,
  pulseOnFirstEncounter = true,
}: InlineGlossaryChipProps): React.JSX.Element {
  const entry = getLoadBearingGlossaryNoun(nounId);
  const [firstPulse, setFirstPulse] = useState(false);

  useEffect(() => {
    if (!pulseOnFirstEncounter || typeof window === "undefined") {
      return;
    }

    const storageKey = resolveSeenStorageKey(nounId);

    if (localStorage.getItem(storageKey) === "1") {
      return;
    }

    setFirstPulse(true);
    const timer = window.setTimeout(() => setFirstPulse(false), 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [nounId, pulseOnFirstEncounter]);

  const markSeen = () => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(resolveSeenStorageKey(nounId), "1");
    setFirstPulse(false);
  };

  return (
    <Tooltip onOpenChange={(open) => open && markSeen()}>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "cursor-help border-b border-dotted border-neutral-500 text-inherit underline-offset-2 dark:border-neutral-400",
            firstPulse && "motion-safe:animate-pulse",
          )}
          data-testid={`inline-glossary-chip-${nounId}`}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="pointer-events-auto max-w-sm py-2">
        <p className={cn("m-0", TOOLTIP_TYPOGRAPHY.title)}>{entry.label}</p>
        <p className={cn("mb-0 mt-1.5 leading-snug", TOOLTIP_TYPOGRAPHY.body)}>{entry.definition}</p>
        <p className={cn("mb-0 mt-2", TOOLTIP_TYPOGRAPHY.body)}>
          <Link className={TOOLTIP_TYPOGRAPHY.link} href={loadBearingGlossaryHelpHref(nounId)}>
            Open glossary →
          </Link>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
