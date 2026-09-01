/** Claim-then-sources evidence strips for `/help/*` platform operations topics. */
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_CLAIM_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ALERTS_HELP_CLAIM_DISCIPLINE,
  ALERTS_HELP_CLAIM_DISCIPLINE_HEADING,
  ALERTS_HELP_CLAIM_HEADING_ID,
  ALERTS_HELP_FOLLOW_UPS_TITLE,
  ALERTS_HELP_SOURCES,
  ALERTS_HELP_SOURCES_INTRO,
} from "@/lib/alerts-help-evidence-copy";
import {
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE_HEADING,
  CONNECT_AWS_SECURELY_CLAIM_HEADING_ID,
  CONNECT_AWS_SECURELY_FOLLOW_UPS_TITLE,
  CONNECT_AWS_SECURELY_SOURCES,
  CONNECT_AWS_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-aws-securely-help-evidence-copy";
import {
  CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE_HEADING,
  CONNECT_AZURE_SECURELY_CLAIM_HEADING_ID,
  CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE,
  CONNECT_AZURE_SECURELY_SOURCES,
  CONNECT_AZURE_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-azure-securely-help-content";
import {
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE,
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE_HEADING,
  CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_HELP_SOURCES,
  CONNECTION_STATUS_HELP_SOURCES_INTRO,
} from "@/lib/connection-status-help-evidence-copy";
import { CONNECTION_STATUS_HELP_CLAIM_HEADING_ID } from "@/lib/connection-status-help-guide-content";
import {
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_CLAIM_DISCIPLINE_HEADING,
  DIGESTS_HELP_FOLLOW_UPS_TITLE,
  DIGESTS_HELP_SOURCES,
  DIGESTS_HELP_SOURCES_INTRO,
} from "@/lib/digests-help-evidence-copy";
import { DIGESTS_HELP_CLAIM_HEADING_ID } from "@/lib/digests-help-guide-content";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE_HEADING,
  ENTERPRISE_ONBOARDING_HELP_CLAIM_HEADING_ID,
  ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
  ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO,
} from "@/lib/enterprise-onboarding-help-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE_HEADING,
  INTEGRATION_READINESS_HELP_CLAIM_HEADING_ID,
  INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE,
  INTEGRATION_READINESS_HELP_SOURCES,
  INTEGRATION_READINESS_HELP_SOURCES_INTRO,
} from "@/lib/integration-readiness-help-evidence-copy";
import {
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE,
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE_HEADING,
  MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_HELP_SOURCES,
  MODEL_GOVERNANCE_HELP_SOURCES_INTRO,
} from "@/lib/model-governance-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID } from "@/lib/model-governance-help-guide-content";
import {
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE,
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE_HEADING,
  PILOT_FEEDBACK_HELP_CLAIM_HEADING_ID,
  PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE,
  PILOT_FEEDBACK_HELP_SOURCES,
  PILOT_FEEDBACK_HELP_SOURCES_INTRO,
} from "@/lib/pilot-feedback-help-evidence-copy";
import {
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE,
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING,
  RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE,
  RECURRENCE_SCHEDULES_HELP_SOURCES,
  RECURRENCE_SCHEDULES_HELP_SOURCES_INTRO,
} from "@/lib/recurrence-schedules-help-evidence-copy";
import { RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID } from "@/lib/recurrence-schedules-help-guide-content";
import {
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING,
  SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE,
  SYSTEM_HEALTH_HELP_SOURCES,
  SYSTEM_HEALTH_HELP_SOURCES_INTRO,
} from "@/lib/system-health-help-evidence-copy";
import { SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID } from "@/lib/system-health-help-guide-content";

export function AlertsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-alerts"
      claimTestId="help-alerts-claim-discipline"
      claim={ALERTS_HELP_CLAIM_DISCIPLINE}
      claimHeading={ALERTS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ALERTS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={ALERTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ALERTS_HELP_SOURCES_INTRO}
      sources={ALERTS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ConnectAwsSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connect-aws-securely-help"
      claim={CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE}
      claimHeading={CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={CONNECT_AWS_SECURELY_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorInfo}
      sourcesTitle={CONNECT_AWS_SECURELY_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECT_AWS_SECURELY_SOURCES_INTRO}
      sources={CONNECT_AWS_SECURELY_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ConnectAzureSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connect-azure-securely-help"
      claim={CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE}
      claimHeading={CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={CONNECT_AZURE_SECURELY_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorInfo}
      sourcesTitle={CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECT_AZURE_SECURELY_SOURCES_INTRO}
      sources={CONNECT_AZURE_SECURELY_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function DigestsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-digests"
      claim={DIGESTS_HELP_CLAIM_DISCIPLINE}
      claimHeading={DIGESTS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={DIGESTS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={DIGESTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={DIGESTS_HELP_SOURCES_INTRO}
      sources={DIGESTS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function RecurrenceSchedulesHelpEvidenceOrientationStrip(
  props: { readonly readingBodyClassName?: string } = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-recurrence-schedules"
      claim={RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE}
      claimHeading={RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID}
      sourcesTitle={RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={RECURRENCE_SCHEDULES_HELP_SOURCES_INTRO}
      sources={RECURRENCE_SCHEDULES_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type ConnectionStatusHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ConnectionStatusHelpEvidenceOrientationStrip(
  props: ConnectionStatusHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-connection-status"
      claim={CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE}
      claimHeading={CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={CONNECTION_STATUS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECTION_STATUS_HELP_SOURCES_INTRO}
      sources={CONNECTION_STATUS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function SystemHealthHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-system-health"
      claim={SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE}
      claimHeading={SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID}
      sourcesTitle={SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SYSTEM_HEALTH_HELP_SOURCES_INTRO}
      sources={SYSTEM_HEALTH_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function EnterpriseOnboardingHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="enterprise-onboarding-help"
      claim={ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE}
      claimHeading={ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ENTERPRISE_ONBOARDING_HELP_CLAIM_HEADING_ID}
      sourcesTitle={ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO}
      sources={ENTERPRISE_ONBOARDING_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function IntegrationReadinessHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="integration-readiness-help"
      claim={INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE}
      claimHeading={INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={INTEGRATION_READINESS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={INTEGRATION_READINESS_HELP_SOURCES_INTRO}
      sources={INTEGRATION_READINESS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function PilotFeedbackHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-pilot-feedback"
      claim={PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE}
      claimHeading={PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PILOT_FEEDBACK_HELP_CLAIM_HEADING_ID}
      sourcesTitle={PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PILOT_FEEDBACK_HELP_SOURCES_INTRO}
      sources={PILOT_FEEDBACK_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export type ModelGovernanceHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ModelGovernanceHelpEvidenceOrientationStrip(
  props: ModelGovernanceHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-model-governance"
      claim={MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE}
      claimHeading={MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID}
      sourcesTitle={MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={MODEL_GOVERNANCE_HELP_SOURCES_INTRO}
      sources={MODEL_GOVERNANCE_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}
