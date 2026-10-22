import Link from "next/link";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const ACCESSIBILITY_BREADCRUMB_HUB_LABEL = "Welcome" as const;
export const ACCESSIBILITY_BREADCRUMB_HUB_PATH = "/welcome" as const;
export const ACCESSIBILITY_BREADCRUMB_TOPIC_TITLE = "Accessibility" as const;

/** Ancestor trail for `/accessibility`: Welcome → Accessibility. */
export function AccessibilityBreadcrumb(): React.JSX.Element {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-2", MARKETING_TYPOGRAPHY.meta)}
      data-testid="accessibility-breadcrumb"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li>
          <Link className={MARKETING_SURFACES.inlineLink} href={ACCESSIBILITY_BREADCRUMB_HUB_PATH}>
            {ACCESSIBILITY_BREADCRUMB_HUB_LABEL}
          </Link>
        </li>
        <li aria-hidden="true" className="text-al-text-secondary">/</li>
        <li aria-current="page" className="text-al-text-primary">
          {ACCESSIBILITY_BREADCRUMB_TOPIC_TITLE}
        </li>
      </ol>
    </nav>
  );
}
