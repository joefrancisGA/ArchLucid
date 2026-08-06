"use client";

import Link from "next/link";

import {
  ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE,
  ACCOUNT_SECURITY_SETTINGS_SOURCES,
  ACCOUNT_SECURITY_SETTINGS_SOURCES_INTRO,
} from "@/lib/account-security-settings-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Workspace Sources + claim discipline for ADS `/administration/account-security`. */
export function AccountSecuritySettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="account-security-settings-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="account-security-settings-sources-heading"
        data-testid="account-security-settings-sources"
      >
        <h2
          id="account-security-settings-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ACCOUNT_SECURITY_SETTINGS_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {ACCOUNT_SECURITY_SETTINGS_SOURCES.map((link) => (
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
        data-testid="account-security-settings-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Personal sign-in controls only
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
