import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE,
  AUTH_DOMAINS_SETTINGS_SOURCES,
  AUTH_DOMAINS_SETTINGS_SOURCES_INTRO,
} from "@/lib/auth-domains-settings-evidence-copy";

/** Sources follow-ups for `/administration/auth-domains` (ADU). */
export function AuthDomainsSettingsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="auth-domains-settings"
      sourcesTestId="auth-domains-settings-sources"
      sourcesTitle={AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTH_DOMAINS_SETTINGS_SOURCES_INTRO}
      sources={AUTH_DOMAINS_SETTINGS_SOURCES}
      hubSecondary
    />
  );
}
