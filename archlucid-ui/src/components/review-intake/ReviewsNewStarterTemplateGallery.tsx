"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { starterArchitectureTemplates } from "@/data/starter-templates";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEWS_NEW_DETAILED_HREF,
  REVIEWS_NEW_QUICK_REVIEW_HREF,
  REVIEWS_NEW_STARTER_TEMPLATE_BROWSE_MORE_ACTION,
  REVIEWS_NEW_STARTER_TEMPLATE_BROWSE_MORE_LEAD,
} from "@/lib/reviews-new-path-copy";
import { cn } from "@/lib/utils";

const featuredTemplateIds = new Set([
  "starter-api-platform-b2b",
  "starter-internal-operations-portal",
  "starter-payment-adjacent-not-chd",
]);

/** Prominent starter templates on the new review page — one click into the wizard with a preset. */
export function ReviewsNewStarterTemplateGallery(): React.JSX.Element {
  const router = useRouter();
  const featured = starterArchitectureTemplates.filter((template) => featuredTemplateIds.has(template.id));
  const hasMoreTemplates = starterArchitectureTemplates.some((template) => !featuredTemplateIds.has(template.id));

  return (
    <section
      aria-labelledby="reviews-new-starter-templates-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="reviews-new-starter-template-gallery"
    >
      <h2
        id="reviews-new-starter-templates-heading"
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Start from template
      </h2>
      <p className={cn("m-0 mt-1 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Pick a reference architecture to pre-fill the review wizard — you can edit every field before starting.
      </p>
      <ul className="m-0 mt-3 grid list-none gap-3 p-0 sm:grid-cols-3">
        {featured.map((template) => (
          <li
            key={template.id}
            className="flex flex-col justify-between gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
          >
            <div className="space-y-1">
              <p className={cn("m-0 text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {template.label}
              </p>
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {template.description}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              data-testid={`reviews-new-template-${template.id}`}
              onClick={() => {
                router.push(`/architecture/reviews/new?preset=${encodeURIComponent(template.id)}`);
              }}
            >
              Use template
            </Button>
          </li>
        ))}
      </ul>
      {hasMoreTemplates ? (
        <p
          className={cn("m-0 mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="reviews-new-starter-template-browse-more"
        >
          {REVIEWS_NEW_STARTER_TEMPLATE_BROWSE_MORE_LEAD}{" "}
          <Link href={REVIEWS_NEW_DETAILED_HREF} className={OPERATOR_LINK.inline}>
            {REVIEWS_NEW_STARTER_TEMPLATE_BROWSE_MORE_ACTION}
          </Link>
        </p>
      ) : null}
      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
        <Link href={REVIEWS_NEW_QUICK_REVIEW_HREF} className={OPERATOR_LINK.inline}>
          Or start blank in the wizard
        </Link>
      </p>
    </section>
  );
}
