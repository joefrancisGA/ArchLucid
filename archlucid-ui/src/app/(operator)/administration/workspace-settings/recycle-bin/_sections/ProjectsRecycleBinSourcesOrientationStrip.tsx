import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE,
  PROJECTS_RECYCLE_BIN_ORIENTATION_SOURCES_INTRO,
  PROJECTS_RECYCLE_BIN_SOURCES,
} from "@/lib/projects-recycle-bin-evidence-copy";
import { PROJECTS_RECYCLE_BIN_SETTINGS_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/projects-recycle-bin-settings-page-copy";

/** Sources-only follow-ups for `/administration/workspace-settings/recycle-bin` buyer-polished shell (STR). */
export function ProjectsRecycleBinSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="projects-recycle-bin-settings"
      stripTestId={PROJECTS_RECYCLE_BIN_SETTINGS_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="projects-recycle-bin-settings-sources"
      sourcesTitle={PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE}
      sourcesIntro={PROJECTS_RECYCLE_BIN_ORIENTATION_SOURCES_INTRO}
      sources={PROJECTS_RECYCLE_BIN_SOURCES}
      hubSecondary
    />
  );
}
