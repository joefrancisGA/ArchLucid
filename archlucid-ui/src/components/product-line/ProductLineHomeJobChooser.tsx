"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { cn } from "@/lib/utils";

type ProductLineHomeJobChooserProps = {
  readonly selectedProductLine: ProductLineId;
  readonly onSelect: (productLine: ProductLineId) => void;
};

const JOBS: readonly {
  readonly id: ProductLineId;
  readonly title: string;
  readonly outcome: string;
}[] = [
  {
    id: "architecture",
    title: "Review an architecture",
    outcome: "You get a finalized architecture package.",
  },
  {
    id: "security",
    title: "Choose an architecture estate",
    outcome: "After you choose an estate, you can see what it can reach.",
  },
];

export function ProductLineHomeJobChooser({
  selectedProductLine,
  onSelect,
}: ProductLineHomeJobChooserProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="product-line-home-jobs-heading"
      className="mb-4 rounded-md border border-border bg-al-surface-raised p-3"
      data-testid="product-line-home-job-chooser"
    >
      <h2 id="product-line-home-jobs-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        What do you want to do?
      </h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {JOBS.map((job) => {
          const selected = selectedProductLine === job.id;

          return (
            <div
              key={job.id}
              className={cn(
                "rounded-md border p-3",
                selected ? "border-al-accent-interactive" : "border-border",
              )}
              data-testid={`product-line-home-job-${job.id}`}
            >
              <Button
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                onClick={() => onSelect(job.id)}
              >
                {job.title}
              </Button>
              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{job.outcome}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
