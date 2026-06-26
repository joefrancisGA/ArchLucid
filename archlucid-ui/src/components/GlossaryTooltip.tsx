"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { useEffect, useState, type ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type GlossaryTermEntry, type GlossaryTermKey, GLOSSARY_TERMS } from "@/lib/glossary-terms";

export type GlossaryTooltipProps = {
  termKey: GlossaryTermKey;
  children: ReactNode;
  /** If false, first-visit pulse animation to the underline is skipped. */
  pulseOnFirstSession?: boolean;
};

const SEEN_KEY_PREFIX = "glossary-seen-";

/**
 * Dotted inline term with a short definition, optional “Learn more” to `docs/library/GLOSSARY.md`, and optional first-visit pulse.
 * Use within an app region wrapped by `TooltipProvider` (see `AppShellClient`).
 */
export function GlossaryTooltip({ termKey, children, pulseOnFirstSession = true }: GlossaryTooltipProps) {
  const entry: GlossaryTermEntry = GLOSSARY_TERMS[termKey];
  const [firstPulse, setFirstPulse] = useState(false);

  useEffect(() => {
    if (!pulseOnFirstSession || typeof window === "undefined") {
      return;
    }

    const storageKey = SEEN_KEY_PREFIX + termKey;

    if (sessionStorage.getItem(storageKey) === "1") {
      return;
    }

    sessionStorage.setItem(storageKey, "1");
    setFirstPulse(true);
    const timer = window.setTimeout(() => setFirstPulse(false), 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [termKey, pulseOnFirstSession]);

  return (
    <Tooltip>
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
      <TooltipContent side="top" className={cn("max-w-sm", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>{entry.term}</p>
        <p className={cn("mb-0 mt-1.5 leading-snug", OPERATOR_TYPOGRAPHY.helper)}>{entry.definition}</p>
        {entry.docLink !== undefined ? (
          <p className={cn("mb-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
            <a
              className="font-medium underline decoration-neutral-300 underline-offset-2 dark:decoration-neutral-600"
              href={entry.docLink}
              target="_blank"
              rel="noreferrer"
            >
              Learn more in glossary →
            </a>
          </p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
