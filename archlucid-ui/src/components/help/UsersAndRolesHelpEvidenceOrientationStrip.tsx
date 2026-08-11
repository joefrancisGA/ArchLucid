import Link from "next/link";

import {
  USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY,
  USERS_AND_ROLES_HELP_AS_OF_LABEL,
  USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE,
  USERS_AND_ROLES_HELP_SOURCES,
  USERS_AND_ROLES_HELP_SOURCES_INTRO,
} from "@/lib/users-and-roles-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help-diligence-artifact-index";
import { cn } from "@/lib/utils";

/** Claim discipline, as-of contract version, and Sources for the users-and-roles capability matrix. */
export function UsersAndRolesHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="users-and-roles-help-orientation">
      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="users-and-roles-help-claim-discipline"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE}</p>
      </aside>

      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="users-and-roles-help-as-of"
      >
        <span className="font-medium text-al-text-primary">{USERS_AND_ROLES_HELP_AS_OF_LABEL}</span>
        {" — "}
        {USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY}
      </p>

      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="users-and-roles-help-sources-heading"
        data-testid="users-and-roles-help-sources"
      >
        <h2
          id="users-and-roles-help-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {HELP_DILIGENCE_ARTIFACT_INDEX_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {USERS_AND_ROLES_HELP_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {USERS_AND_ROLES_HELP_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link
                className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
