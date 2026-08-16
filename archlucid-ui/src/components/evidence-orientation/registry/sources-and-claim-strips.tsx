import {
  EvidenceOrientationSourcesAndClaimStrip,
  type EvidenceOrientationStripPart,
} from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
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
  COMPLIANCE_JOURNEY_SOURCES,
  COMPLIANCE_JOURNEY_SOURCES_INTRO,
} from "@/lib/compliance-journey-evidence-copy";
import {
  EXAMPLE_ROI_BULLETIN_SOURCES,
  EXAMPLE_ROI_BULLETIN_SOURCES_INTRO,
} from "@/lib/example-roi-bulletin-evidence-copy";
import { FAQ_CLAIM_DISCIPLINE, FAQ_SOURCES, FAQ_SOURCES_INTRO } from "@/lib/faq-evidence-copy";
import {
  GET_STARTED_SOURCES,
  GET_STARTED_SOURCES_INTRO,
} from "@/lib/get-started-evidence-copy";
import {
  PRIVACY_CLAIM_DISCIPLINE,
  PRIVACY_SOURCES,
  PRIVACY_SOURCES_INTRO,
} from "@/lib/privacy-evidence-copy";
import {
  QUICK_SCAN_SOURCES,
  QUICK_SCAN_SOURCES_INTRO,
} from "@/lib/quick-scan-evidence-copy";
import {
  SECURITY_TRUST_CLAIM_DISCIPLINE,
  SECURITY_TRUST_SOURCES,
  SECURITY_TRUST_SOURCES_INTRO,
} from "@/lib/security-trust-evidence-copy";
import { SEE_IT_SOURCES, SEE_IT_SOURCES_INTRO } from "@/lib/see-it-evidence-copy";
import {
  SHOWCASE_CLAIM_DISCIPLINE,
  SHOWCASE_SOURCES,
  SHOWCASE_SOURCES_INTRO,
} from "@/lib/showcase-evidence-copy";
import {
  SIGNUP_CLAIM_DISCIPLINE,
  SIGNUP_CLAIM_DISCIPLINE_HEADING,
  SIGNUP_SOURCES,
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
import {
  WELCOME_CLAIM_DISCIPLINE,
  WELCOME_SOURCES,
  WELCOME_SOURCES_INTRO,
} from "@/lib/welcome-evidence-copy";
import { WHY_CLAIM_DISCIPLINE, WHY_SOURCES, WHY_SOURCES_INTRO } from "@/lib/why-evidence-copy";

/**
 * Props for surfaces that render sample output. They place the claim band beside the sample and the
 * Sources index at the page foot, so each call site names which half it is rendering.
 */
export type SplitEvidenceOrientationStripProps = {
  readonly part?: EvidenceOrientationStripPart;
};

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
      part="sources"
      margin="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-800"
      align="text-left"
      sourcesIntro={COMPLIANCE_JOURNEY_SOURCES_INTRO}
      sources={COMPLIANCE_JOURNEY_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading=""
      claim=""
    />
  );
}

export function ExampleRoiBulletinEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="example-roi-bulletin"
      part="sources"
      margin="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-800"
      align="text-left"
      sourcesIntro={EXAMPLE_ROI_BULLETIN_SOURCES_INTRO}
      sources={EXAMPLE_ROI_BULLETIN_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading=""
      claim=""
    />
  );
}

export function FaqEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="faq"
      margin="mt-10"
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
      part="sources"
      margin="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-800"
      align="text-left"
      sourcesIntro={GET_STARTED_SOURCES_INTRO}
      sources={GET_STARTED_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading=""
      claim=""
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
      part="sources"
      margin="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-800"
      align="text-left"
      sourcesIntro={QUICK_SCAN_SOURCES_INTRO}
      sources={QUICK_SCAN_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading=""
      claim=""
    />
  );
}

export function SecurityTrustEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="assurance-status"
      part="sources"
      margin="mt-8"
      sourcesIntro={SECURITY_TRUST_SOURCES_INTRO}
      sources={SECURITY_TRUST_SOURCES}
      claimHeading=""
      claim=""
    />
  );
}

export function SeeItEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="see-it"
      part="sources"
      margin="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-800"
      align="text-left"
      sourcesIntro={SEE_IT_SOURCES_INTRO}
      sources={SEE_IT_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading=""
      claim=""
    />
  );
}

export function ShowcaseEvidenceOrientationStrip({
  part,
}: SplitEvidenceOrientationStripProps = {}): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="showcase"
      part={part}
      margin={part === "sources" ? "mt-10" : "mt-6"}
      align="text-left"
      sourcesIntro={SHOWCASE_SOURCES_INTRO}
      sources={SHOWCASE_SOURCES}
      claimHeading="Illustrative sample only"
      claim={SHOWCASE_CLAIM_DISCIPLINE}
    />
  );
}

export function SignupEvidenceOrientationStrip({
  part,
}: SplitEvidenceOrientationStripProps = {}): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="signup"
      part={part}
      margin={
        part === "sources"
          ? "mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-800"
          : part === "claim"
            ? "mb-0"
            : "mt-8"
      }
      align="text-left"
      sourcesIntro={SIGNUP_SOURCES_INTRO}
      sources={SIGNUP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
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
      part="sources"
      margin="mt-8"
      sourcesIntro={TRUST_CENTER_SOURCES_INTRO}
      sources={TRUST_CENTER_SOURCES}
      claimHeading=""
      claim=""
    />
  );
}

export function WelcomeEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="welcome"
      margin="mt-10"
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
      margin="mt-10"
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
