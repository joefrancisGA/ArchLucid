import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DIGESTS_BROWSE_INCLUDES_ITEMS,
  DIGESTS_BROWSE_INCLUDES_SECTION_TITLE,
} from "@/lib/digests-browse-copy";

/** Preview of digest sections shown before any digest history exists. */
export function DigestsBrowseIncludesPreview(): React.JSX.Element {
  return (
    <section
      aria-labelledby="digests-browse-includes-heading"
      className="mt-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/70 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="digests-browse-includes-preview"
    >
      <h3 id="digests-browse-includes-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {DIGESTS_BROWSE_INCLUDES_SECTION_TITLE}
      </h3>
      <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {DIGESTS_BROWSE_INCLUDES_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
