"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { starterArchitectureTemplates } from "@/data/starter-templates";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
        <Link href="/architecture/reviews/new?path=quick-review" className="text-al-link underline-offset-2 hover:underline">
          Or start blank in the wizard
        </Link>
      </p>
    </section>
  );
}
