import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  ARCHITECTURE_CREATED_CLARIFICATIONS_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES,
  ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES_INTRO,
} from "@/lib/architecture/architecture-created-clarifications-sources";
import {
  ARCHITECTURE_CREATED_FINDINGS_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO,
} from "@/lib/architecture/architecture-created-findings-sources";
import {
  EVIDENCE_CLAIM_STYLE,
  EVIDENCE_SOURCES_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ARCHITECTURE_CREATED_OVERVIEW_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_OVERVIEW_SOURCES,
  ARCHITECTURE_CREATED_OVERVIEW_SOURCES_INTRO,
} from "@/lib/architecture/architecture-created-overview-sources";
import {
  ACCESSIBILITY_CLAIM_DISCIPLINE,
  ACCESSIBILITY_SOURCES,
  ACCESSIBILITY_SOURCES_INTRO,
} from "@/lib/accessibility-evidence-copy";
import {
  COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE,
  COMPLIANCE_JOURNEY_SOURCES,
  COMPLIANCE_JOURNEY_SOURCES_INTRO,
} from "@/lib/compliance-journey-evidence-copy";
import {
  DEMO_PREVIEW_CLAIM_DISCIPLINE,
  DEMO_PREVIEW_SOURCES,
  DEMO_PREVIEW_SOURCES_INTRO,
} from "@/lib/demo-preview-evidence-copy";
import {
  EXAMPLE_ROI_BULLETIN_CLAIM_DISCIPLINE,
  EXAMPLE_ROI_BULLETIN_SOURCES,
  EXAMPLE_ROI_BULLETIN_SOURCES_INTRO,
} from "@/lib/example-roi-bulletin-evidence-copy";
import { FAQ_CLAIM_DISCIPLINE, FAQ_SOURCES, FAQ_SOURCES_INTRO } from "@/lib/faq-evidence-copy";
import {
  LIVE_DEMO_CLAIM_DISCIPLINE,
  LIVE_DEMO_SOURCES,
  LIVE_DEMO_SOURCES_INTRO,
} from "@/lib/live-demo-evidence-copy";
import {
  GET_STARTED_CLAIM_DISCIPLINE,
  GET_STARTED_SOURCES,
  GET_STARTED_SOURCES_INTRO,
} from "@/lib/get-started-evidence-copy";
import {
  PRICING_CLAIM_DISCIPLINE,
  PRICING_SOURCES,
  PRICING_SOURCES_INTRO,
} from "@/lib/pricing-evidence-copy";
import {
  PRIVACY_CLAIM_DISCIPLINE,
  PRIVACY_SOURCES,
  PRIVACY_SOURCES_INTRO,
} from "@/lib/privacy-evidence-copy";
import {
  QUICK_SCAN_CLAIM_DISCIPLINE,
  QUICK_SCAN_SOURCES,
  QUICK_SCAN_SOURCES_INTRO,
} from "@/lib/quick-scan-evidence-copy";
import {
  SECURITY_TRUST_CLAIM_DISCIPLINE,
  SECURITY_TRUST_SOURCES,
  SECURITY_TRUST_SOURCES_INTRO,
} from "@/lib/security-trust-evidence-copy";
import { SEE_IT_CLAIM_DISCIPLINE, SEE_IT_SOURCES, SEE_IT_SOURCES_INTRO } from "@/lib/see-it-evidence-copy";
import {
  SHOWCASE_CLAIM_DISCIPLINE,
  SHOWCASE_SOURCES,
  SHOWCASE_SOURCES_INTRO,
} from "@/lib/showcase-evidence-copy";
import {
  SIGNUP_CLAIM_DISCIPLINE,
  SIGNUP_CLAIM_DISCIPLINE_HEADING,
  SIGNUP_SOURCES,
  SIGNUP_SOURCES_HEADING,
  SIGNUP_SOURCES_INTRO,
} from "@/lib/signup-evidence-copy";
import {
  SIGNUP_VERIFY_CLAIM_DISCIPLINE,
  SIGNUP_VERIFY_SOURCES,
  SIGNUP_VERIFY_SOURCES_INTRO,
} from "@/lib/signup-verify-evidence-copy";
import {
  TRUST_CENTER_CLAIM_DISCIPLINE,
  TRUST_CENTER_SOURCES,
  TRUST_CENTER_SOURCES_INTRO,
} from "@/lib/trust-center-evidence-copy";
import { TRY_CLAIM_DISCIPLINE, TRY_SOURCES, TRY_SOURCES_INTRO } from "@/lib/try-evidence-copy";
import {
  WELCOME_CLAIM_DISCIPLINE,
  WELCOME_SOURCES,
  WELCOME_SOURCES_INTRO,
} from "@/lib/welcome-evidence-copy";
import { WHY_CLAIM_DISCIPLINE, WHY_SOURCES, WHY_SOURCES_INTRO } from "@/lib/why-evidence-copy";

export function ArchitectureCreatedClarificationsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="architecture-clarifications"
      align="text-left"
      sourcesIntro={ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES}
      claimHeading="Pre-finalize gaps only"
      claim={ARCHITECTURE_CREATED_CLARIFICATIONS_CLAIM_DISCIPLINE}
    />
  );
}

export function ArchitectureCreatedFindingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="architecture-findings"
      align="text-left"
      sourcesIntro={ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_FINDINGS_SOURCES}
      claimHeading="Pre-finalize findings only"
      claim={ARCHITECTURE_CREATED_FINDINGS_CLAIM_DISCIPLINE}
    />
  );
}

export function ArchitectureCreatedOverviewEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="architecture-overview"
      align="text-left"
      sourcesIntro={ARCHITECTURE_CREATED_OVERVIEW_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_OVERVIEW_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationInfoCallout}
      claimHeading="Pre-finalize orientation only"
      claim={ARCHITECTURE_CREATED_OVERVIEW_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
    />
  );
}

export function AccessibilityEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="accessibility"
      align="text-left"
      sourcesIntro={ACCESSIBILITY_SOURCES_INTRO}
      sources={ACCESSIBILITY_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading="Public accessibility statement only"
      claim={ACCESSIBILITY_CLAIM_DISCIPLINE}
    />
  );
}

export function ComplianceJourneyEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="compliance-journey"
      margin="mt-6"
      align="text-left"
      sourcesIntro={COMPLIANCE_JOURNEY_SOURCES_INTRO}
      sources={COMPLIANCE_JOURNEY_SOURCES}
      claimHeading="Posture summary only"
      claim={COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE}
    />
  );
}

export function DemoPreviewEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="demo-preview"
      margin="mt-8"
      align="text-left"
      sourcesIntro={DEMO_PREVIEW_SOURCES_INTRO}
      sources={DEMO_PREVIEW_SOURCES}
      claimHeading="Sample demo only"
      claim={DEMO_PREVIEW_CLAIM_DISCIPLINE}
    />
  );
}

export function ExampleRoiBulletinEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="example-roi-bulletin"
      margin="mt-6"
      align="text-left"
      sourcesIntro={EXAMPLE_ROI_BULLETIN_SOURCES_INTRO}
      sources={EXAMPLE_ROI_BULLETIN_SOURCES}
      claimHeading="Synthetic sample only"
      claim={EXAMPLE_ROI_BULLETIN_CLAIM_DISCIPLINE}
    />
  );
}

export function FaqEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="faq"
      margin="mt-8"
      align="text-left"
      sourcesIntro={FAQ_SOURCES_INTRO}
      sources={FAQ_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading="Evaluation orientation only"
      claim={FAQ_CLAIM_DISCIPLINE}
    />
  );
}

export function GetStartedEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="get-started"
      align="text-left"
      sourcesIntro={GET_STARTED_SOURCES_INTRO}
      sources={GET_STARTED_SOURCES}
      claimHeading="First-run orientation only"
      claim={GET_STARTED_CLAIM_DISCIPLINE}
    />
  );
}

export function LiveDemoEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="live-demo"
      margin="mt-6"
      align="text-left"
      sourcesIntro={LIVE_DEMO_SOURCES_INTRO}
      sources={LIVE_DEMO_SOURCES}
      claimHeading="Illustrative sample only"
      claim={LIVE_DEMO_CLAIM_DISCIPLINE}
    />
  );
}

export function PricingEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="pricing"
      margin="mb-10"
      sourcesIntro={PRICING_SOURCES_INTRO}
      sources={PRICING_SOURCES}
      claimHeading="Commercial packaging only"
      claim={PRICING_CLAIM_DISCIPLINE}
    />
  );
}

export function PrivacyEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="privacy"
      margin="mt-6"
      align="text-left"
      sourcesIntro={PRIVACY_SOURCES_INTRO}
      sources={PRIVACY_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading="Legal notice only"
      claim={PRIVACY_CLAIM_DISCIPLINE}
      claimElement="div"
    />
  );
}

export function QuickScanEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="quick-scan"
      align="text-left"
      sourcesIntro={QUICK_SCAN_SOURCES_INTRO}
      sources={QUICK_SCAN_SOURCES}
      claimHeading="Demo scan only"
      claim={QUICK_SCAN_CLAIM_DISCIPLINE}
    />
  );
}

export function SecurityTrustEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="security-trust"
      sourcesIntro={SECURITY_TRUST_SOURCES_INTRO}
      sources={SECURITY_TRUST_SOURCES}
      claimHeading="Engagement metadata only"
      claim={SECURITY_TRUST_CLAIM_DISCIPLINE}
    />
  );
}

export function SeeItEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="see-it"
      margin="mt-10"
      align="text-left"
      sourcesIntro={SEE_IT_SOURCES_INTRO}
      sources={SEE_IT_SOURCES}
      claimHeading="Illustrative sample only"
      claim={SEE_IT_CLAIM_DISCIPLINE}
    />
  );
}

export function ShowcaseEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="showcase"
      margin="mt-6"
      align="text-left"
      sourcesIntro={SHOWCASE_SOURCES_INTRO}
      sources={SHOWCASE_SOURCES}
      claimHeading="Illustrative sample only"
      claim={SHOWCASE_CLAIM_DISCIPLINE}
    />
  );
}

export function SignupEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="signup"
      margin="mt-8"
      align="text-left"
      sourcesTitle={SIGNUP_SOURCES_HEADING}
      sourcesIntro={SIGNUP_SOURCES_INTRO}
      sources={SIGNUP_SOURCES}
      claimHeading={SIGNUP_CLAIM_DISCIPLINE_HEADING}
      claim={SIGNUP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.evaluationNeutral}
    />
  );
}

export function SignupVerifyEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="signup-verify"
      margin="mt-8"
      align="text-left"
      sourcesIntro={SIGNUP_VERIFY_SOURCES_INTRO}
      sources={SIGNUP_VERIFY_SOURCES}
      claimHeading="Evaluation access only"
      claim={SIGNUP_VERIFY_CLAIM_DISCIPLINE}
    />
  );
}

export function TrustCenterEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="trust-center"
      sourcesIntro={TRUST_CENTER_SOURCES_INTRO}
      sources={TRUST_CENTER_SOURCES}
      claimHeading="Public assurance posture only"
      claim={TRUST_CENTER_CLAIM_DISCIPLINE}
    />
  );
}

export function TryEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="try"
      margin="mt-6"
      align="text-left"
      sourcesIntro={TRY_SOURCES_INTRO}
      sources={TRY_SOURCES}
      claimHeading="Illustrative sample only"
      claim={TRY_CLAIM_DISCIPLINE}
    />
  );
}

export function WelcomeEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="welcome"
      margin="mb-10"
      align="text-left"
      sourcesIntro={WELCOME_SOURCES_INTRO}
      sources={WELCOME_SOURCES}
      claimHeading="Marketing orientation only"
      claim={WELCOME_CLAIM_DISCIPLINE}
    />
  );
}

export function WhyEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="why"
      margin="mt-6"
      align="text-left"
      sourcesIntro={WHY_SOURCES_INTRO}
      sources={WHY_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMuted}
      claimHeading="About these comparisons"
      claim={WHY_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.evaluationNeutral}
    />
  );
}
