import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  DEVELOPER_SETTINGS_FOLLOW_UPS_TITLE,
  DEVELOPER_SETTINGS_SOURCES,
  DEVELOPER_SETTINGS_SOURCES_INTRO,
} from "@/lib/developer-settings-evidence-copy";

/** Sources follow-ups for `/administration/developer` (SDX). */
export function DeveloperSettingsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="developer-settings"
      sourcesTestId="developer-settings-sources"
      sourcesTitle={DEVELOPER_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={DEVELOPER_SETTINGS_SOURCES_INTRO}
      sources={DEVELOPER_SETTINGS_SOURCES}
      hubSecondary
    />
  );
}
