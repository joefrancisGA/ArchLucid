"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE,
  resolveUsersAndRolesHelpSources,
  resolveUsersAndRolesHelpSourcesIntro,
} from "@/lib/users-and-roles-help-evidence-copy";
import { USERS_AND_ROLES_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/users-and-roles-help-page-copy";
import {
  helpUsersAndRolesSourcesDisclosureHrefFromSearch,
  parseHelpUsersAndRolesSourcesOpenFromSearch,
} from "@/lib/help/help-users-and-roles-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpUsersAndRolesSourcesOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-users-and-roles-sources"
      searchParamKey="helpUsersAndRolesSourcesOpen"
      parseOpenFromSearch={parseHelpUsersAndRolesSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpUsersAndRolesSourcesDisclosureHrefFromSearch}
      sectionTestId={USERS_AND_ROLES_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE}
      intro={resolveUsersAndRolesHelpSourcesIntro(productLine)}
      links={resolveUsersAndRolesHelpSources(productLine)}
      sourcesTestId="help-users-and-roles-sources"
    />
  );
}
