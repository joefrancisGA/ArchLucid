"use client";

import Link from "next/link";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  OPERATOR_CO_ARCHITECT_BRAND_LINE,
  OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY,
  OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY,
  OPERATOR_CO_ARCHITECT_HOME_STRIP_ARIA_LABEL,
  OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY,
  OPERATOR_CO_ARCHITECT_INTENT_STORAGE_KEY,
  type OperatorCoArchitectIntentFocus,
} from "@/lib/operator-co-architect-copy";
import { cn } from "@/lib/utils";

function writeStoredIntent(next: OperatorCoArchitectIntentFocus): void {
  try {
    window.localStorage.setItem(OPERATOR_CO_ARCHITECT_INTENT_STORAGE_KEY, next);
  } catch {
    /* private mode */
  }
}

/**
 * Always-visible operator-home strip: umbrella brand line and two entry intents (review lead, describe secondary).
 * Persists last-clicked intent in localStorage for future wizard routing; same `/reviews/new` entry today.
 */
export function OperatorCoArchitectHomeStrip() {
  const onPick = useCallback((next: OperatorCoArchitectIntentFocus) => {
    writeStoredIntent(next);
  }, []);

  return (
    <section
      aria-label={OPERATOR_CO_ARCHITECT_HOME_STRIP_ARIA_LABEL}
      className={cn(
        "rounded-xl border border-neutral-200/90 bg-neutral-50/80 px-4 py-3 shadow-sm",
        "dark:border-neutral-700/80 dark:bg-neutral-900/50",
      )}
    >
      <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{OPERATOR_CO_ARCHITECT_BRAND_LINE}</p>
      <p className="m-0 mt-1 text-xs leading-snug text-neutral-600 dark:text-neutral-400">{OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button asChild variant="primary" size="sm" className="cursor-pointer">
          <Link href="/reviews/new" onClick={() => onPick("review")}>
            {OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="cursor-pointer">
          <Link href="/reviews/new?intent=describe" onClick={() => onPick("describe")}>
            {OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY}
          </Link>
        </Button>
      </div>
    </section>
  );
}
