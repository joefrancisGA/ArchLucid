"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE,
  USERS_AND_ROLES_HELP_SOURCES,
  USERS_AND_ROLES_HELP_SOURCES_INTRO,
} from "@/lib/users-and-roles-help-evidence-copy";
import { USERS_AND_ROLES_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/users-and-roles-help-page-copy";
import {
  helpUsersAndRolesSourcesDisclosureHrefFromSearch,
  parseHelpUsersAndRolesSourcesOpenFromSearch,
} from "@/lib/help/help-users-and-roles-sources-disclosure-url";

/** Sources-only follow-ups for `/help/users-and-roles` buyer-polished shell (HOE). */
export function HelpUsersAndRolesSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpUsersAndRolesSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpUsersAndRolesSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpUsersAndRolesSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSourcesOpen = useCallback(
    (open: boolean) => {
      setSourcesOpenState(open);
      syncSourcesOpenToUrl(open);
    },
    [syncSourcesOpenToUrl],
  );

  useEffect(() => {
    setSourcesOpenState(parseHelpUsersAndRolesSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE}
      summaryLine={USERS_AND_ROLES_HELP_SOURCES_INTRO}
      sectionTestId={USERS_AND_ROLES_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-users-and-roles-sources"
        headingId="where-to-go-next"
        title={USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE}
        intro={USERS_AND_ROLES_HELP_SOURCES_INTRO}
        links={USERS_AND_ROLES_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
