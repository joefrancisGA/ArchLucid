import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_RELATED_PAGES_TITLE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
  ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO,
} from "@/lib/enterprise-onboarding-help-evidence-copy";

/** Claim discipline + related setup pages for `/help/enterprise-onboarding`. */
export function EnterpriseOnboardingHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="enterprise-onboarding-help"
      claim={ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE}
      sourcesTitle={ENTERPRISE_ONBOARDING_HELP_RELATED_PAGES_TITLE}
      sourcesIntro={ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO}
      sources={ENTERPRISE_ONBOARDING_HELP_SOURCES}
    />
  );
}
