import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_LEAD,
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA,
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_SAMPLE_DISCLOSURE,
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS,
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TITLE,
  buildGoldenSponsorPackageWalkthroughHref,
} from "@/lib/golden-sponsor-package-walkthrough";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type GoldenSponsorPackageWalkthroughPanelProps = {
  readonly entryHref?: string;
  readonly compact?: boolean;
};

/** Unified sample → package → sponsor export walkthrough entry (TB-2138). */
export function GoldenSponsorPackageWalkthroughPanel(
  props: GoldenSponsorPackageWalkthroughPanelProps,
): React.JSX.Element {
  const entryHref = props.entryHref ?? buildGoldenSponsorPackageWalkthroughHref();
  const compact = props.compact === true;

  return (
    <section
      aria-labelledby="golden-sponsor-package-walkthrough-heading"
      className={cn(
        OPERATOR_CARD.body,
        "rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900",
        compact && "p-3",
      )}
      data-testid="golden-sponsor-package-walkthrough"
    >
      <div className={cn("space-y-2", OPERATOR_LAYOUT.sectionHeadingStack)}>
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="golden-sponsor-package-walkthrough-heading"
            className={cn("m-0", compact ? OPERATOR_TYPE_SCALE.sectionTitle : OPERATOR_TYPE_SCALE.cardTitle)}
          >
            {GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TITLE}
          </h2>
          <StatusTag kind="draft" label="Illustrative sample" />
        </div>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
          {GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_LEAD}
        </p>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
          {GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_SAMPLE_DISCLOSURE}
        </p>
      </div>

      <ol
        className={cn("m-0 list-none space-y-2 p-0", compact ? "mt-3" : "mt-4")}
        data-testid="golden-sponsor-package-walkthrough-steps"
      >
        {GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS.map((step, index) => (
          <li key={step.id} className="flex gap-3" data-testid={`golden-sponsor-package-walkthrough-step-${step.id}`}>
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-xs font-semibold text-neutral-700 dark:border-neutral-600 dark:text-neutral-200",
              )}
            >
              {index + 1}
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPE_SCALE.body)}>{step.label}</p>
              {!compact ? (
                <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>{step.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <div className={cn(compact ? "mt-3" : "mt-4")}>
        <Button asChild variant="outline" size="sm" className="h-8 w-fit">
          <Link href={entryHref} data-testid="golden-sponsor-package-walkthrough-primary">
            {GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA}
          </Link>
        </Button>
      </div>
    </section>
  );
}
