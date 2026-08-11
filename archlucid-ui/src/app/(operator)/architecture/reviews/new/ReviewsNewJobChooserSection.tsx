import { cn } from "@/lib/utils";

import { AcceleratorJobChooserList } from "@/components/accelerator/AcceleratorJobChooserList";
import {
  ACCELERATOR_JOB_CHOOSER_HEADING,
  ACCELERATOR_JOB_CHOOSER_LEAD,
} from "@/lib/accelerator-chooser-start-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Optional accelerator packs, offered below the primary create-review form (TB-2136). */
export function ReviewsNewJobChooserSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="reviews-new-job-chooser-heading"
      className="space-y-3 border-t border-neutral-200 pt-5 dark:border-neutral-800"
      data-testid="reviews-new-job-chooser-section"
    >
      <div>
        <h2
          id="reviews-new-job-chooser-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {ACCELERATOR_JOB_CHOOSER_HEADING}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ACCELERATOR_JOB_CHOOSER_LEAD}
        </p>
      </div>
      <AcceleratorJobChooserList
        compact
        listTestId="reviews-new-job-chooser-list"
        rowTestIdPrefix="reviews-new-job-chooser-row"
        startTestIdPrefix="reviews-new-job-chooser-start"
      />
    </section>
  );
}
