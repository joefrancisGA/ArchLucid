"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  OPERATOR_CO_ARCHITECT_BRAND_LINE,
  OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY,
  OPERATOR_CO_ARCHITECT_CTA_OPEN_EXISTING,
  OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY,
  OPERATOR_CO_ARCHITECT_HOME_STRIP_ARIA_LABEL,
  OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY,
  OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY_BUYER,
  OPERATOR_CO_ARCHITECT_INTENT_STORAGE_KEY,
  type OperatorCoArchitectIntentFocus,
} from "@/lib/operator/operator-co-architect-copy";
import { OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function writeStoredIntent(next: OperatorCoArchitectIntentFocus): void {
  try {
    window.localStorage.setItem(OPERATOR_CO_ARCHITECT_INTENT_STORAGE_KEY, next);
  } catch {
    /* private mode */
  }
}

type OperatorCoArchitectHomeStripProps = {
  /** Buyer-polished home: stronger card treatment and three governed CTAs. */
  readonly buyerPolishedShell?: boolean;
};

/**
 * Always-visible operator-home strip: umbrella brand line and entry intents (review lead, describe secondary).
 * Persists last-clicked intent in localStorage for future wizard routing; same `/architecture/reviews/new` entry today.
 */
export function OperatorCoArchitectHomeStrip({ buyerPolishedShell = false }: OperatorCoArchitectHomeStripProps) {
  const onPick = useCallback((next: OperatorCoArchitectIntentFocus) => {
    writeStoredIntent(next);
  }, []);

  const bodyCopy = buyerPolishedShell ? OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY_BUYER : OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY;

  return (
    <section
      aria-label={OPERATOR_CO_ARCHITECT_HOME_STRIP_ARIA_LABEL}
      data-testid="operator-co-architect-home-strip"
      className={cn(
        buyerPolishedShell
          ? "rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          : "rounded-xl border border-neutral-200/90 bg-neutral-50/80 px-4 py-3 shadow-sm dark:border-neutral-700/80 dark:bg-neutral-900/50",
      )}
    >
      <p className={cn("m-0", buyerPolishedShell ? OPERATOR_TYPE_SCALE.cardTitle : (cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)))}>
        {OPERATOR_CO_ARCHITECT_BRAND_LINE}
      </p>
      <p className={cn("m-0 mt-2", buyerPolishedShell ? OPERATOR_TYPE_SCALE.body : (cn("mt-1 leading-snug", OPERATOR_TYPOGRAPHY.helper)), "text-neutral-600 dark:text-neutral-400")}>
        {bodyCopy}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button asChild variant="primary" size={buyerPolishedShell ? "default" : "sm"} className="cursor-pointer">
          <Link href="/architecture/reviews/new" onClick={() => onPick("review")}>
            {OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY}
          </Link>
        </Button>
        <Button asChild variant="outline" size={buyerPolishedShell ? "default" : "sm"} className="cursor-pointer">
          <Link href="/architecture/reviews/new?intent=describe" onClick={() => onPick("describe")}>
            {OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY}
          </Link>
        </Button>
        <Button asChild variant="outline" size={buyerPolishedShell ? "default" : "sm"} className="cursor-pointer">
          <Link href="/architecture/reviews">{OPERATOR_CO_ARCHITECT_CTA_OPEN_EXISTING}</Link>
        </Button>
      </div>
    </section>
  );
}
