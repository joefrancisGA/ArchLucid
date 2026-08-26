import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SUPPORT_WORKSPACE_FOLLOW_UPS_TITLE,
  SUPPORT_WORKSPACE_SOURCES,
  SUPPORT_WORKSPACE_SOURCES_INTRO,
} from "@/lib/support-workspace-evidence-copy";

/** Claim discipline + Sources index for Support workspace (ASX). */
export function AdminSupportClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="support-workspace"
      sourcesTitle={SUPPORT_WORKSPACE_FOLLOW_UPS_TITLE}
      sourcesIntro={SUPPORT_WORKSPACE_SOURCES_INTRO}
      sources={SUPPORT_WORKSPACE_SOURCES}
    />
  );
}
