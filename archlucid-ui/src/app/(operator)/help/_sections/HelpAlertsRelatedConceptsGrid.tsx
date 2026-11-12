"use client";

import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { resolveAlertsHelpRelatedConcepts } from "@/lib/alerts-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Product-line-aware related concept links on the alerts help guide. */
export function HelpAlertsRelatedConceptsGrid(): React.JSX.Element {
  const { productLine } = useProductLine();
  const relatedConcepts = resolveAlertsHelpRelatedConcepts(productLine);

  return (
    <div className="grid gap-3" data-testid="help-alerts-related-concepts">
      {relatedConcepts.map((concept) => (
        <div
          key={concept.title}
          className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
        >
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{concept.title}</h3>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{concept.description}</p>
          <Link
            className={cn("mt-2 inline-block text-sm underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
            href={concept.href}
          >
            {concept.linkLabel}
          </Link>
        </div>
      ))}
    </div>
  );
}
