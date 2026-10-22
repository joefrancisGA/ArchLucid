import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type HealthRelatedSurfaceLink = {
  readonly label: string;
  readonly href: string;
};

export type HealthRelatedSurfacesStripProps = {
  readonly intro: string;
  readonly links: readonly HealthRelatedSurfaceLink[];
  readonly testId: string;
};

/**
 * Persistent escalation path. These links previously sat inside a collapsed "Technical details"
 * disclosure, which hid navigation behind a label that promised diagnostics.
 */
export function HealthRelatedSurfacesStrip(props: HealthRelatedSurfacesStripProps): React.JSX.Element {
  return (
    <section
      aria-labelledby={`${props.testId}-heading`}
      className="rounded-md border border-neutral-200 p-4 dark:border-neutral-700"
      data-testid={props.testId}
    >
      <h2 id={`${props.testId}-heading`} className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Related readiness surfaces
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.intro}</p>
      <ul className={cn("m-0 mt-3 flex flex-wrap gap-x-4 gap-y-2 list-none p-0", OPERATOR_TYPOGRAPHY.body)}>
        {props.links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={OPERATOR_LINK.nav}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
