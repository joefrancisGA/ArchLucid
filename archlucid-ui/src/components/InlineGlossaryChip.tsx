"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  getGoldenPathGlossaryNoun,
  goldenPathGlossaryHelpHref,
  goldenPathGlossarySeenStorageKey,
  type GoldenPathGlossaryNounId,
} from "@/lib/golden-path-glossary-nouns";

export type InlineGlossaryChipProps = {
  readonly nounId: GoldenPathGlossaryNounId;
  readonly children: React.ReactNode;
  /** When false, skip first-encounter pulse on the chip affordance. */
  readonly pulseOnFirstEncounter?: boolean;
};

/**
 * Inline product-noun chip with a one-sentence definition popover sourced from `customer-glossary-manifest.ts`.
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
    <span className="inline-flex flex-wrap items-baseline gap-1">
      <span>{children}</span>
      <Popover onOpenChange={(open) => open && markSeen()}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-5 min-w-5 cursor-help items-center justify-center rounded-full border border-neutral-300 bg-neutral-50 px-1 font-semibold text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
              OPERATOR_TYPOGRAPHY.micro,
              firstPulse && "motion-safe:animate-pulse",
            )}
            aria-label={`What is ${entry.label}?`}
            data-testid={`inline-glossary-chip-${nounId}`}
          >
            ?
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="max-w-sm">
          <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {entry.label}
          </p>
          <p className={cn("m-0 mt-1.5 leading-snug text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            {entry.definition}
          </p>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-400" href={goldenPathGlossaryHelpHref(nounId)}>
              Open glossary →
            </Link>
          </p>
        </PopoverContent>
      </Popover>
    </span>
  );
}
