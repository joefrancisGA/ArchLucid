"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import {
  PRODUCT_LINE_HOME_JOB_ARCHITECTURE_OPEN_LIST_LABEL,
  PRODUCT_LINE_HOME_JOB_ARCHITECTURE_OUTCOME,
  PRODUCT_LINE_HOME_JOB_ARCHITECTURE_TITLE,
  PRODUCT_LINE_HOME_JOB_SECURITY_OUTCOME,
  PRODUCT_LINE_HOME_JOB_SECURITY_TITLE,
} from "@/lib/product-line/product-line-copy";
import { cn } from "@/lib/utils";

type ProductLineHomeJobChooserProps = {
  readonly selectedProductLine: ProductLineId;
  readonly onSelect: (productLine: ProductLineId) => void;
};

const JOBS: readonly {
  readonly id: ProductLineId;
  readonly title: string;
  readonly outcome: string;
  readonly openListHref: string | null;
  readonly openListLabel: string | null;
}[] = [
  {
    id: "architecture",
    title: PRODUCT_LINE_HOME_JOB_ARCHITECTURE_TITLE,
    outcome: PRODUCT_LINE_HOME_JOB_ARCHITECTURE_OUTCOME,
    openListHref: ARCHITECTURES_LIST_PATH,
    openListLabel: PRODUCT_LINE_HOME_JOB_ARCHITECTURE_OPEN_LIST_LABEL,
  },
  {
    id: "security",
    title: PRODUCT_LINE_HOME_JOB_SECURITY_TITLE,
    outcome: PRODUCT_LINE_HOME_JOB_SECURITY_OUTCOME,
    openListHref: null,
    openListLabel: null,
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
          const showOpenList =
            selected && job.openListHref !== null && job.openListLabel !== null;

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
              {showOpenList ? (
                <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
                  <Link
                    href={job.openListHref}
                    className={OPERATOR_LINK.inline}
                    data-testid={`product-line-home-job-${job.id}-open-list`}
                  >
                    {job.openListLabel}
                  </Link>
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}