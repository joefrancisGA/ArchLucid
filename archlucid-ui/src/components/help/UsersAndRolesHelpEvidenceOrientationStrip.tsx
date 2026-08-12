import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EvidenceOrientationMetaLine } from "@/components/evidence-orientation/EvidenceOrientationMetaLine";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";
import {
  USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY,
  USERS_AND_ROLES_HELP_AS_OF_LABEL,
  USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE,
  USERS_AND_ROLES_HELP_SOURCES,
  USERS_AND_ROLES_HELP_SOURCES_INTRO,
} from "@/lib/users-and-roles-help-evidence-copy";

/** Claim discipline, as-of contract version, and Sources for the users-and-roles capability matrix. */
export function UsersAndRolesHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="users-and-roles-help-orientation">
      <EvidenceOrientationClaimCallout
        testId="users-and-roles-help-claim-discipline"
        body={USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE}
      />

      <EvidenceOrientationMetaLine
        testId="users-and-roles-help-as-of"
        label={USERS_AND_ROLES_HELP_AS_OF_LABEL}
        text={USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY}
      />

      <EvidenceOrientationSourcesSection
        testId="users-and-roles-help-sources"
        headingId="users-and-roles-help-sources-heading"
        title={HELP_DILIGENCE_ARTIFACT_INDEX_TITLE}
        intro={USERS_AND_ROLES_HELP_SOURCES_INTRO}
        links={USERS_AND_ROLES_HELP_SOURCES}
      />
    </EvidenceOrientationStripShell>
  );
}
