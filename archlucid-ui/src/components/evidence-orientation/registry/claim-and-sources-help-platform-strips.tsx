/** Claim-then-sources evidence strips for `/help/*` topics covering platform, account, and trust operations. */
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ALERTS_HELP_CLAIM_DISCIPLINE,
  ALERTS_HELP_CLAIM_DISCIPLINE_HEADING,
  ALERTS_HELP_CLAIM_HEADING_ID,
  ALERTS_HELP_FOLLOW_UPS_TITLE,
  ALERTS_HELP_SOURCES,
  ALERTS_HELP_SOURCES_INTRO,
} from "@/lib/alerts-help-evidence-copy";
import {
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE,
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE_HEADING,
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_HEADING_ID,
  AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO,
} from "@/lib/authentication-sign-in-help-evidence-copy";
import {
  BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE,
  BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE_HEADING,
  BILLING_AND_PLANS_HELP_CLAIM_HEADING_ID,
  BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE,
  BILLING_AND_PLANS_HELP_SOURCES,
  BILLING_AND_PLANS_HELP_SOURCES_INTRO,
} from "@/lib/billing-and-plans-help-evidence-copy";
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
  EVIDENCE_CLAIM_STYLE,
  EVIDENCE_SOURCES_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_CLAIM_DISCIPLINE_HEADING,
  DIGESTS_HELP_FOLLOW_UPS_TITLE,
  DIGESTS_HELP_SOURCES,
  DIGESTS_HELP_SOURCES_INTRO,
} from "@/lib/digests-help-evidence-copy";
import { DIGESTS_HELP_CLAIM_HEADING_ID } from "@/lib/digests-help-guide-content";
import {
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE,
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING,
  RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE,
  RECURRENCE_SCHEDULES_HELP_SOURCES,
  RECURRENCE_SCHEDULES_HELP_SOURCES_INTRO,
} from "@/lib/recurrence-schedules-help-evidence-copy";
import { RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID } from "@/lib/recurrence-schedules-help-guide-content";
import {
  API_KEYS_HELP_CLAIM_DISCIPLINE,
  API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING,
  API_KEYS_HELP_FOLLOW_UPS_TITLE,
  API_KEYS_HELP_SOURCES,
  API_KEYS_HELP_SOURCES_INTRO,
} from "@/lib/api-keys-help-evidence-copy";
import { API_KEYS_HELP_CLAIM_HEADING_ID } from "@/lib/api-keys-help-guide-content";
import {
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING,
  SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE,
  SYSTEM_HEALTH_HELP_SOURCES,
  SYSTEM_HEALTH_HELP_SOURCES_INTRO,
} from "@/lib/system-health-help-evidence-copy";
import { SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID } from "@/lib/system-health-help-guide-content";
import {
  AI_USAGE_HELP_CLAIM_DISCIPLINE,
  AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING,
  AI_USAGE_HELP_FOLLOW_UPS_TITLE,
  AI_USAGE_HELP_SOURCES,
  AI_USAGE_HELP_SOURCES_INTRO,
} from "@/lib/ai-usage-help-evidence-copy";
import { AI_USAGE_HELP_CLAIM_HEADING_ID } from "@/lib/ai-usage-help-guide-content";
import {
  PREFERENCES_HELP_CLAIM_DISCIPLINE,
  PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING,
  PREFERENCES_HELP_FOLLOW_UPS_TITLE,
  PREFERENCES_HELP_SOURCES,
  PREFERENCES_HELP_SOURCES_INTRO,
} from "@/lib/preferences-help-evidence-copy";
import { PREFERENCES_HELP_CLAIM_HEADING_ID } from "@/lib/preferences-help-guide-content";
import {
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE,
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE_HEADING,
  NOTIFICATIONS_HELP_CLAIM_HEADING_ID,
  NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE,
  NOTIFICATIONS_HELP_SOURCES,
  NOTIFICATIONS_HELP_SOURCES_INTRO,
} from "@/lib/notifications-help-evidence-copy";
import {
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE,
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE_HEADING,
  MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_HELP_SOURCES,
  MODEL_GOVERNANCE_HELP_SOURCES_INTRO,
} from "@/lib/model-governance-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID } from "@/lib/model-governance-help-guide-content";
import {
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  WORKSPACE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  WORKSPACE_SETTINGS_HELP_SOURCES,
  WORKSPACE_SETTINGS_HELP_SOURCES_INTRO,
} from "@/lib/workspace-settings-help-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID } from "@/lib/workspace-settings-help-guide-content";
import {
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE,
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE_HEADING,
  CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_HELP_SOURCES,
  CONNECTION_STATUS_HELP_SOURCES_INTRO,
} from "@/lib/connection-status-help-evidence-copy";
import { CONNECTION_STATUS_HELP_CLAIM_HEADING_ID } from "@/lib/connection-status-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE_HEADING,
  ENTERPRISE_ONBOARDING_HELP_CLAIM_HEADING_ID,
  ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
  ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO,
} from "@/lib/enterprise-onboarding-help-evidence-copy";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE_HEADING,
  INTEGRATION_READINESS_HELP_CLAIM_HEADING_ID,
  INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE,
  INTEGRATION_READINESS_HELP_SOURCES,
  INTEGRATION_READINESS_HELP_SOURCES_INTRO,
} from "@/lib/integration-readiness-help-evidence-copy";
import {
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE,
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE_HEADING,
  PILOT_FEEDBACK_HELP_CLAIM_HEADING_ID,
  PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE,
  PILOT_FEEDBACK_HELP_SOURCES,
  PILOT_FEEDBACK_HELP_SOURCES_INTRO,
} from "@/lib/pilot-feedback-help-evidence-copy";
import {
  REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE,
  REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE_HEADING,
  REPORT_A_PROBLEM_HELP_CLAIM_HEADING_ID,
  REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE,
  REPORT_A_PROBLEM_HELP_SOURCES,
  REPORT_A_PROBLEM_HELP_SOURCES_INTRO,
} from "@/lib/report-a-problem-help-evidence-copy";
import {
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE_HEADING,
  SECURITY_TRUST_HELP_CLAIM_HEADING_ID,
  SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE,
  SECURITY_TRUST_HELP_SOURCES,
  SECURITY_TRUST_HELP_SOURCES_INTRO,
} from "@/lib/security-trust-help-evidence-copy";
import {
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE_HEADING,
  SUBPROCESSORS_HELP_CLAIM_HEADING_ID,
  SUBPROCESSORS_HELP_FOLLOW_UPS_TITLE,
  SUBPROCESSORS_HELP_SOURCES,
  SUBPROCESSORS_HELP_SOURCES_INTRO,
} from "@/lib/subprocessors-help-evidence-copy";

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

export function AuthenticationSignInHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="authentication-sign-in-help"
      claim={AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE}
      claimHeading={AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={AUTHENTICATION_SIGN_IN_HELP_CLAIM_HEADING_ID}
      sourcesTitle={AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO}
      sources={AUTHENTICATION_SIGN_IN_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function BillingAndPlansHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-billing-and-plans"
      claimTestId="help-billing-claim-discipline"
      claim={BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE}
      claimHeading={BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={BILLING_AND_PLANS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={BILLING_AND_PLANS_HELP_SOURCES_INTRO}
      sources={BILLING_AND_PLANS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
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

export function RecurrenceSchedulesHelpEvidenceOrientationStrip(): React.JSX.Element {
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

export function ApiKeysHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-api-keys"
      claim={API_KEYS_HELP_CLAIM_DISCIPLINE}
      claimHeading={API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={API_KEYS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={API_KEYS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={API_KEYS_HELP_SOURCES_INTRO}
      sources={API_KEYS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="wrap"
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

export function AiUsageHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-ai-usage"
      claim={AI_USAGE_HELP_CLAIM_DISCIPLINE}
      claimHeading={AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={AI_USAGE_HELP_CLAIM_HEADING_ID}
      sourcesTitle={AI_USAGE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AI_USAGE_HELP_SOURCES_INTRO}
      sources={AI_USAGE_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="wrap"
    />
  );
}

export type PreferencesHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function PreferencesHelpEvidenceOrientationStrip(
  props: PreferencesHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-preferences"
      claim={PREFERENCES_HELP_CLAIM_DISCIPLINE}
      claimHeading={PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PREFERENCES_HELP_CLAIM_HEADING_ID}
      sourcesTitle={PREFERENCES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PREFERENCES_HELP_SOURCES_INTRO}
      sources={PREFERENCES_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type NotificationsHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function NotificationsHelpEvidenceOrientationStrip(
  props: NotificationsHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-notifications"
      claim={NOTIFICATIONS_HELP_CLAIM_DISCIPLINE}
      claimHeading={NOTIFICATIONS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={NOTIFICATIONS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={NOTIFICATIONS_HELP_SOURCES_INTRO}
      sources={NOTIFICATIONS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type WorkspaceSettingsHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function WorkspaceSettingsHelpEvidenceOrientationStrip(
  props: WorkspaceSettingsHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  const sectionHeadingClass = cn(
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    OPERATOR_TYPOGRAPHY.sectionTitle,
    "m-0 scroll-mt-24",
  );

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-workspace-settings"
      claim={WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE}
      claimHeading={WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorInlineNote}
      sourcesTitle={WORKSPACE_SETTINGS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={WORKSPACE_SETTINGS_HELP_SOURCES_INTRO}
      sources={WORKSPACE_SETTINGS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorMuted}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="wrap"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
      headingClassName={sectionHeadingClass}
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

export function ReportProblemHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="report-a-problem-help"
      claim={REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE}
      claimHeading={REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={REPORT_A_PROBLEM_HELP_CLAIM_HEADING_ID}
      sourcesTitle={REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={REPORT_A_PROBLEM_HELP_SOURCES_INTRO}
      sources={REPORT_A_PROBLEM_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function SecurityTrustHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="security-trust-help"
      claim={SECURITY_TRUST_HELP_CLAIM_DISCIPLINE}
      claimHeading={SECURITY_TRUST_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SECURITY_TRUST_HELP_CLAIM_HEADING_ID}
      sourcesTitle={SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SECURITY_TRUST_HELP_SOURCES_INTRO}
      sources={SECURITY_TRUST_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function SubprocessorsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="subprocessors-help"
      claim={SUBPROCESSORS_HELP_CLAIM_DISCIPLINE}
      claimHeading={SUBPROCESSORS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SUBPROCESSORS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={SUBPROCESSORS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SUBPROCESSORS_HELP_SOURCES_INTRO}
      sources={SUBPROCESSORS_HELP_SOURCES}
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
