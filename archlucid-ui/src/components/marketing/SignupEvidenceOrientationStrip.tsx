import Link from "next/link";

import {
  SIGNUP_CLAIM_DISCIPLINE,
  SIGNUP_CLAIM_DISCIPLINE_HEADING,
  SIGNUP_SOURCES,
  SIGNUP_SOURCES_HEADING,
  SIGNUP_SOURCES_INTRO,
} from "@/lib/signup-evidence-copy";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Evaluation Sources + claim discipline for `/signup` (SIG Evidence). */
export function SignupEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="mt-8 space-y-3 text-left" data-testid="signup-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="signup-sources-heading"
        data-testid="signup-sources"
      >
        <h2
          id="signup-sources-heading"
          className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}
        >
          {SIGNUP_SOURCES_HEADING}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          {SIGNUP_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", MARKETING_TYPOGRAPHY.body)}>
          {SIGNUP_SOURCES.map((link) => (
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
        className="rounded-md border border-neutral-200 bg-neutral-50/40 p-3 dark:border-neutral-700 dark:bg-neutral-900/30"
        data-testid="signup-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
          {SIGNUP_CLAIM_DISCIPLINE_HEADING}
        </h2>
        <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          {SIGNUP_CLAIM_DISCIPLINE}
        </p>
      </aside>
    </div>
  );
}
