import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Slim home card linking to Getting started for workspace setup without internal checklist jargon (TB-443). */
export function OperatorHomeContinueSetupCard() {
  return (
    <section
      aria-labelledby="continue-setup-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, "flex items-center justify-between gap-4")}
      data-testid="home-block-continue-setup"
    >
      <div className={cn("min-w-0 flex-1", OPERATOR_LAYOUT.sectionHeadingStack)}>
        <OperatorHomeCardSectionTitle id="continue-setup-heading">Continue setup</OperatorHomeCardSectionTitle>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
          Finish workspace setup, reviewer access, and optional cloud connections.
        </p>
      </div>
      <Link
        href="/onboarding"
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5",
          OPERATOR_TYPE_SCALE.button,
          "font-medium text-al-text-primary hover:border-neutral-400 hover:bg-[var(--al-layer-hover)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)]",
          "dark:border-neutral-700 dark:hover:border-neutral-600",
        )}
      >
        Continue getting started
        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </Link>
    </section>
  );
}
