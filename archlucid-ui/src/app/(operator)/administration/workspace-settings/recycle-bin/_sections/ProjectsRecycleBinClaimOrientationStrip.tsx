import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE,
  PROJECTS_RECYCLE_BIN_SOURCES,
  PROJECTS_RECYCLE_BIN_SOURCES_INTRO,
} from "@/lib/projects-recycle-bin-evidence-copy";

/** Sources follow-ups for `/administration/workspace-settings/recycle-bin` (STR). */
export function ProjectsRecycleBinClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="projects-recycle-bin-settings"
      sourcesTestId="projects-recycle-bin-settings-sources"
      sourcesTitle={PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE}
      sourcesIntro={PROJECTS_RECYCLE_BIN_SOURCES_INTRO}
      sources={PROJECTS_RECYCLE_BIN_SOURCES}
      hubSecondary
    />
  );
}
