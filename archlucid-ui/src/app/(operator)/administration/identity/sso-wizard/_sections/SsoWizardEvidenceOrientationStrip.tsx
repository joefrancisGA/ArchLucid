"use client";

import Link from "next/link";

import {
  SSO_WIZARD_CLAIM_DISCIPLINE,
  SSO_WIZARD_SOURCES,
  SSO_WIZARD_SOURCES_INTRO,
} from "@/lib/sso-wizard-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Workspace Sources + claim discipline for ASS `/administration/identity/sso-wizard`. */
export function SsoWizardEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="sso-wizard-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="sso-wizard-sources-heading"
        data-testid="sso-wizard-sources"
      >
        <h2
          id="sso-wizard-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SSO_WIZARD_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {SSO_WIZARD_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="sso-wizard-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Access configuration only
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
