"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TOOLTIP_TYPOGRAPHY } from "@/lib/design-tokens";

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
 * Dotted inline term with a short definition, optional “Learn more” to `/help/glossary`, and optional first-visit pulse.
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
      <TooltipContent side="top" className="pointer-events-auto max-w-sm py-2">
        <p className={cn("m-0", TOOLTIP_TYPOGRAPHY.title)}>{entry.term}</p>
        <p className={cn("mb-0 mt-1.5 leading-snug", TOOLTIP_TYPOGRAPHY.body)}>{entry.definition}</p>
        {entry.docLink !== undefined ? (
          <p className={cn("mb-0 mt-2", TOOLTIP_TYPOGRAPHY.body)}>
            <Link className={TOOLTIP_TYPOGRAPHY.link} href={entry.docLink}>
              Learn more in glossary →
            </Link>
          </p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
