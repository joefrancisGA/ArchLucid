import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { DIGESTS_BROWSE_INCLUDES_ITEMS } from "@/lib/digests-browse-copy";

/**
 * Sections a generated digest contains. Rendered inside a disclosure (TB-1480) —
 * the surrounding `CollapsibleSection` owns the heading and card chrome.
 */
export function DigestsBrowseIncludesPreview(): ReactElement {
  return (
    <ul
      className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="digests-browse-includes-preview"
    >
      {DIGESTS_BROWSE_INCLUDES_ITEMS.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
