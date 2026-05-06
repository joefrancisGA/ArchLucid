"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

function readStoredIntent(): OperatorCoArchitectIntentFocus | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(OPERATOR_CO_ARCHITECT_INTENT_STORAGE_KEY);

    if (raw === "review" || raw === "describe") {
      return raw;
    }

    return null;
  } catch {
    return null;
  }
}

function writeStoredIntent(next: OperatorCoArchitectIntentFocus): void {
  try {
    window.localStorage.setItem(OPERATOR_CO_ARCHITECT_INTENT_STORAGE_KEY, next);
  } catch {
    /* private mode */
  }
}

/**
 * Always-visible operator-home strip: umbrella brand line and two entry intents (review lead, describe secondary).
 * Persists last-clicked intent for future wizard routing; same `/reviews/new` entry today.
 */
export function OperatorCoArchitectHomeStrip() {
  const [hydrated, setHydrated] = useState(false);
  const [focus, setFocus] = useState<OperatorCoArchitectIntentFocus | null>(null);

  useEffect(() => {
    setFocus(readStoredIntent());
    setHydrated(true);
  }, []);

  const onPick = useCallback((next: OperatorCoArchitectIntentFocus) => {
    setFocus(next);
    writeStoredIntent(next);
  }, []);

  if (!hydrated) {
    return <div className="min-h-[4.5rem] w-full" aria-hidden />;
  }

  return (
    <section
      aria-label={OPERATOR_CO_ARCHITECT_HOME_STRIP_ARIA_LABEL}
      className={cn(
        "rounded-xl border border-teal-200/90 bg-gradient-to-r from-teal-50/90 to-white px-4 py-3 shadow-sm",
        "dark:border-teal-900/80 dark:from-teal-950/40 dark:to-neutral-900",
      )}
    >
      <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{OPERATOR_CO_ARCHITECT_BRAND_LINE}</p>
      <p className="m-0 mt-1 text-xs leading-snug text-neutral-600 dark:text-neutral-400">{OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button asChild variant="primary" className="h-9 text-sm font-semibold">
          <Link href="/reviews/new" onClick={() => onPick("review")}>
            {OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY}
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-9 border-teal-300 text-sm font-medium text-teal-900 dark:border-teal-700 dark:text-teal-200">
          <Link href="/reviews/new?intent=describe" onClick={() => onPick("describe")}>
            {OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY}
          </Link>
        </Button>
      </div>
      {focus !== null ? (
        <p className="m-0 mt-2 text-[11px] text-neutral-500 dark:text-neutral-500" aria-live="polite">
          Last selected entry: {focus === "review" ? "Architecture review" : "Describe what you want"} (same new-review flow;
          preference is saved in this browser).
        </p>
      ) : null}
    </section>
  );
}
