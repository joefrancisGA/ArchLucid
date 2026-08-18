import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE } from "@/lib/azure-permissions-help-evidence-copy";
import { EvidenceOrientationLead } from "@/components/evidence-orientation/EvidenceOrientationLead";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_NOT_THIS,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
  CAIQ_SIG_RESPONSE_HELP_LEAD,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
  CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO,
} from "@/lib/caiq-sig-response-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";
import { cn } from "@/lib/utils";
import { EVIDENCE_CLAIM_STYLE, EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE_HEADING,
  CONNECT_GCP_SECURELY_CLAIM_HEADING_ID,
  CONNECT_GCP_SECURELY_FOLLOW_UPS_TITLE,
  CONNECT_GCP_SECURELY_SOURCES,
  CONNECT_GCP_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-gcp-securely-help-evidence-copy";
import { EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE } from "@/lib/evidence-trail-help-evidence-copy";
import { SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE } from "@/lib/sponsor-report-help-evidence-copy";
import Link from "next/link";
import {
  GLOSSARY_HELP_CLAIM_DISCIPLINE_LEAD,
  GLOSSARY_HELP_CLAIM_DISCIPLINE_TAIL,
  GLOSSARY_HELP_FOLLOW_UP_LINKS,
} from "@/lib/glossary-help-evidence-copy";
import { PILOT_GUIDE_HELP_CLAIM_DISCIPLINE } from "@/lib/pilot-guide-help-evidence-copy";
import { EVALUATION_SOURCES_TITLE } from "@/lib/evaluation-sources-title";
import { PRICING_SOURCES, PRICING_SOURCES_INTRO } from "@/lib/pricing-evidence-copy";
import { ProcurementHelpDiligenceCtaSection } from "@/components/help/ProcurementHelpDiligenceCtaSection";
import { ProcurementHelpPostureSummary } from "@/components/help/ProcurementHelpPostureSummary";
import { PROCUREMENT_HELP_CLAIM_DISCIPLINE, PROCUREMENT_HELP_LEAD } from "@/lib/procurement-help-evidence-copy";
import { SCOPE_HELP_CLAIM_DISCIPLINE } from "@/lib/scope-help-evidence-copy";
import { EvidenceOrientationMetaLine } from "@/components/evidence-orientation/EvidenceOrientationMetaLine";
import {
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE_HEADING,
  TROUBLESHOOTING_HELP_CLAIM_HEADING_ID,
  TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE,
  TROUBLESHOOTING_HELP_SOURCES,
  TROUBLESHOOTING_HELP_SOURCES_INTRO,
} from "@/lib/troubleshooting-help-evidence-copy";
import {
  USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY,
  USERS_AND_ROLES_HELP_AS_OF_LABEL,
  USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE,
  USERS_AND_ROLES_HELP_SOURCES,
  USERS_AND_ROLES_HELP_SOURCES_INTRO,
} from "@/lib/users-and-roles-help-evidence-copy";

export function AzurePermissionsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimCallout
      testId="azure-permissions-help-claim-discipline"
      body={AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE}
    />
  );
}

export function CaiqSigResponseHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="caiq-sig-response-help-orientation">
      <EvidenceOrientationLead
        testId="caiq-sig-response-help-lead"
        text={CAIQ_SIG_RESPONSE_HELP_LEAD}
      />

      <EvidenceOrientationClaimCallout
        testId="caiq-sig-response-help-claim-discipline"
        body={CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE}
        heading={{
          id: "caiq-sig-response-help-claim-heading",
          text: CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
        }}
      >
        <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
          {CAIQ_SIG_RESPONSE_HELP_CLAIM_NOT_THIS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </EvidenceOrientationClaimCallout>

      <EvidenceOrientationSourcesSection
        testId="caiq-sig-response-help-sources"
        headingId="caiq-sig-response-help-sources-heading"
        title={HELP_DILIGENCE_ARTIFACT_INDEX_TITLE}
        intro={CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO}
        links={CAIQ_SIG_RESPONSE_HELP_SOURCES}
        layout="stacked"
      />
    </EvidenceOrientationStripShell>
  );
}

export function ConnectGcpSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="connect-gcp-securely-help-orientation">
      <EvidenceOrientationClaimCallout
        testId="connect-gcp-securely-help-claim-discipline"
        body={CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE}
        style={EVIDENCE_CLAIM_STYLE.operatorInfo}
        heading={{
          id: CONNECT_GCP_SECURELY_CLAIM_HEADING_ID,
          text: CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE_HEADING,
        }}
      />

      <EvidenceOrientationSourcesSection
        testId="connect-gcp-securely-help-sources"
        headingId="connect-gcp-securely-help-sources-heading"
        title={CONNECT_GCP_SECURELY_FOLLOW_UPS_TITLE}
        intro={CONNECT_GCP_SECURELY_SOURCES_INTRO}
        links={CONNECT_GCP_SECURELY_SOURCES}
      />
    </EvidenceOrientationStripShell>
  );
}

export function EvidenceTrailHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimCallout
      testId="evidence-trail-help-claim-discipline"
      body={EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE}
    />
  );
}

export function SponsorReportHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className={cn(DESIGN_TOKENS.callout.warn, "p-3")} data-testid="help-sponsor-report-claim-discipline">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE}</p>
    </div>
  );
}

/** Separator before each follow-up link: nothing, a comma, or ", or " before the last one. */
function followUpSeparator(index: number): string | null {
  if (index === 0) {
    return null;
  }

  return index === GLOSSARY_HELP_FOLLOW_UP_LINKS.length - 1 ? ", or " : ", ";
}

export function GlossaryHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimCallout
      testId="glossary-help-claim-discipline"
      body={
        <>
          {GLOSSARY_HELP_CLAIM_DISCIPLINE_LEAD} Open{" "}
          {GLOSSARY_HELP_FOLLOW_UP_LINKS.map((link, index) => (
            <span key={link.href}>
              {followUpSeparator(index)}
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </span>
          ))}{" "}
          {GLOSSARY_HELP_CLAIM_DISCIPLINE_TAIL}
        </>
      }
    />
  );
}

export function PilotGuideHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimCallout
      testId="pilot-guide-help-claim-discipline"
      body={PILOT_GUIDE_HELP_CLAIM_DISCIPLINE}
    />
  );
}

/**
 * Sources only — `/pricing` carries no claim-discipline band.
 *
 * Tier cards, the FAQ, and the quote panel make no assurance claim, so a "not procurement evidence"
 * caution would hedge against something the page never says. That is the disclaimer-dilution the
 * owner ruled out in **TB-2091** / **TB-2092**; pricing kept its band only because TB-2092 scoped
 * the sweep to operator surfaces. The Sources index stays: pricing questions do turn into security
 * and packaging questions, and Assurance status / Trust Center are the honest next click.
 *
 * Uses the shell for page rhythm (`mt-10`) rather than the shared sources-and-claim strip, whose
 * claim props are required.
 */
export function PricingEvidenceOrientationStrip(props: {
  readonly placement?: "top" | "footer";
}): React.JSX.Element {
  const margin = props.placement === "top" ? "mb-8" : "mt-10";

  return (
    <EvidenceOrientationStripShell testId="pricing-orientation" margin={margin}>
      <EvidenceOrientationSourcesSection
        testId="pricing-sources"
        headingId="pricing-sources-heading"
        title={EVALUATION_SOURCES_TITLE}
        intro={PRICING_SOURCES_INTRO}
        links={PRICING_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.evaluationMuted}
      />
    </EvidenceOrientationStripShell>
  );
}

export function ProcurementHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="procurement-help-orientation">
      <EvidenceOrientationLead testId="procurement-help-lead" text={PROCUREMENT_HELP_LEAD} />

      <EvidenceOrientationClaimCallout
        testId="procurement-help-claim-discipline"
        body={PROCUREMENT_HELP_CLAIM_DISCIPLINE}
      />

      <ProcurementHelpDiligenceCtaSection />

      <ProcurementHelpPostureSummary />
    </EvidenceOrientationStripShell>
  );
}

export function ScopeHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimCallout
      testId="scope-help-claim-discipline"
      body={SCOPE_HELP_CLAIM_DISCIPLINE}
    />
  );
}

export function TroubleshootingHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="troubleshooting-help"
      claimTestId="troubleshooting-help-claim-discipline"
      claim={TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE}
      claimHeading={TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={TROUBLESHOOTING_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      sourcesTitle={TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={TROUBLESHOOTING_HELP_SOURCES_INTRO}
      sources={TROUBLESHOOTING_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

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
