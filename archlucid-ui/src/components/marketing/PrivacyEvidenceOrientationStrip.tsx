import Link from "next/link";

import {
  PRIVACY_CLAIM_DISCIPLINE,
  PRIVACY_SOURCES,
  PRIVACY_SOURCES_INTRO,
} from "@/lib/privacy-evidence-copy";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Evaluation Sources + claim discipline for `/privacy` (PRB Evidence). */
export function PrivacyEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="mt-6 space-y-3 text-left" data-testid="privacy-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="privacy-sources-heading"
        data-testid="privacy-sources"
      >
        <h2
          id="privacy-sources-heading"
          className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          {PRIVACY_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", MARKETING_TYPOGRAPHY.body)}>
          {PRIVACY_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={MARKETING_SURFACES.inlineLink} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="privacy-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
          Legal notice only
        </h2>
        <p className={cn("m-0 mt-2", MARKETING_TYPOGRAPHY.body)}>{PRIVACY_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
