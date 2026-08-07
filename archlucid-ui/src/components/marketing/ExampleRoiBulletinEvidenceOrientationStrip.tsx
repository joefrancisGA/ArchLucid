import Link from "next/link";

import {
  EXAMPLE_ROI_BULLETIN_CLAIM_DISCIPLINE,
  EXAMPLE_ROI_BULLETIN_SOURCES,
  EXAMPLE_ROI_BULLETIN_SOURCES_INTRO,
} from "@/lib/example-roi-bulletin-evidence-copy";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Evaluation Sources + claim discipline for `/example-roi-bulletin` (EXA Evidence). */
export function ExampleRoiBulletinEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="mt-6 space-y-3 text-left" data-testid="example-roi-bulletin-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="example-roi-bulletin-sources-heading"
        data-testid="example-roi-bulletin-sources"
      >
        <h2
          id="example-roi-bulletin-sources-heading"
          className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          {EXAMPLE_ROI_BULLETIN_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", MARKETING_TYPOGRAPHY.body)}>
          {EXAMPLE_ROI_BULLETIN_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link
                className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="example-roi-bulletin-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
          Synthetic sample only
        </h2>
        <p className={cn("m-0 mt-2", MARKETING_TYPOGRAPHY.body)}>{EXAMPLE_ROI_BULLETIN_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
