import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE,
  USERS_AND_ROLES_HELP_SOURCES,
  USERS_AND_ROLES_HELP_SOURCES_INTRO,
} from "@/lib/users-and-roles-help-evidence-copy";

/** Sources-only follow-ups for `/help/users-and-roles` buyer-polished shell (HOE). */
export function HelpUsersAndRolesSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="users-and-roles-help"
      sourcesTestId="help-users-and-roles-sources"
      sourcesTitle={USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={USERS_AND_ROLES_HELP_SOURCES_INTRO}
      sources={USERS_AND_ROLES_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
