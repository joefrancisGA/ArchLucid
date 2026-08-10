"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TOOLTIP_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  getGoldenPathGlossaryNoun,
  goldenPathGlossaryHelpHref,
  goldenPathGlossarySeenStorageKey,
  type GoldenPathGlossaryNounId,
} from "@/lib/golden-path-glossary-nouns";

export type InlineGlossaryChipProps = {
  readonly nounId: GoldenPathGlossaryNounId;
  readonly children: React.ReactNode;
  /** When false, skip first-encounter pulse on the term affordance. */
  readonly pulseOnFirstEncounter?: boolean;
};

/**
 * Inline golden-path product noun with a dotted underline and short definition tooltip
 * sourced from `customer-glossary-manifest.ts`.
 */
export function InlineGlossaryChip({
  nounId,
  children,
  pulseOnFirstEncounter = true,
}: InlineGlossaryChipProps): React.JSX.Element {
  const entry = getGoldenPathGlossaryNoun(nounId);
  const [firstPulse, setFirstPulse] = useState(false);

  useEffect(() => {
    if (!pulseOnFirstEncounter || typeof window === "undefined") {
      return;
    }

    const storageKey = goldenPathGlossarySeenStorageKey(nounId);

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

    localStorage.setItem(goldenPathGlossarySeenStorageKey(nounId), "1");
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
          <Link className={TOOLTIP_TYPOGRAPHY.link} href={goldenPathGlossaryHelpHref(nounId)}>
            Open glossary →
          </Link>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
