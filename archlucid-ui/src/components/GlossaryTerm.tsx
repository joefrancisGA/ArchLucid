"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { useEffect, useState, type ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GLOSSARY_DEFINITIONS, type GlossaryDefinitionId } from "@/lib/glossary-definitions";

export type GlossaryTermProps = {
  termId: GlossaryDefinitionId;
  children: ReactNode;
  /** If false, first-visit pulse animation to the underline is skipped. */
  pulseOnFirstSession?: boolean;
};

const SEEN_KEY_PREFIX = "glossary-definition-seen-";

/**
 * Core glossary term: short text in a Radix tooltip, optional inline expansion for the long definition (“Learn more”).
 * Wrap with `TooltipProvider` (see `AppShellClient`). Distinct from {@link GlossaryTooltip}, which uses the full `glossary-terms` catalog.
 */
export function GlossaryTerm({ termId, children, pulseOnFirstSession = true }: GlossaryTermProps) {
  const entry = GLOSSARY_DEFINITIONS[termId];
  const [firstPulse, setFirstPulse] = useState(false);
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);

  useEffect(() => {
    if (!pulseOnFirstSession || typeof window === "undefined") {
      return;
    }

    const storageKey = SEEN_KEY_PREFIX + termId;

    if (sessionStorage.getItem(storageKey) === "1") {
      return;
    }

    sessionStorage.setItem(storageKey, "1");
    setFirstPulse(true);
    const timer = window.setTimeout(() => setFirstPulse(false), 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [termId, pulseOnFirstSession]);

  return (
    <Tooltip
      onOpenChange={(open) => {
        if (!open) {
          setLearnMoreOpen(false);
        }
      }}
    >
      <TooltipTrigger asChild>
        <span
          className={cn(
            "cursor-help border-b border-dotted border-neutral-500 text-inherit underline-offset-2 dark:border-neutral-400",
            firstPulse && "motion-safe:animate-pulse",
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className={cn("max-w-sm pointer-events-auto", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>{entry.displayLabel}</p>
        <p className={cn("mb-0 mt-1.5 leading-snug", OPERATOR_TYPOGRAPHY.helper)}>{entry.shortDefinition}</p>
        <p className={cn("mb-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
          <button
            type="button"
            className="m-0 cursor-pointer border-0 bg-transparent p-0 font-medium text-inherit underline decoration-neutral-300 underline-offset-2 dark:decoration-neutral-600"
            aria-expanded={learnMoreOpen}
            onClick={() => setLearnMoreOpen((prev) => !prev)}
          >
            {learnMoreOpen ? "Show less" : "Learn more"}
          </button>
        </p>
        {learnMoreOpen ? (
          <p className={cn("mb-0 mt-2 border-t border-neutral-700 pt-2 leading-snug dark:border-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            {entry.longDefinition}
          </p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
