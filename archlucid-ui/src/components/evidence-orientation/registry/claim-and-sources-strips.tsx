import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import {
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
  AUDIT_TRAIL_HELP_SOURCES,
  AUDIT_TRAIL_HELP_SOURCES_INTRO,
} from "@/lib/audit-trail-help-evidence-copy";
import {
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO,
} from "@/lib/authentication-sign-in-help-evidence-copy";
import {
  COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE,
  COMPARISON_REPLAY_HELP_SOURCES,
  COMPARISON_REPLAY_HELP_SOURCES_INTRO,
} from "@/lib/comparison-replay-help-evidence-copy";
import {
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AWS_SECURELY_SOURCES,
  CONNECT_AWS_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-aws-securely-help-evidence-copy";
import {
  CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AZURE_SECURELY_SOURCES,
  CONNECT_AZURE_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-azure-securely-help-content";
import {
  EVIDENCE_CLAIM_STYLE,
  EVIDENCE_SOURCES_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_FOLLOW_UPS_TITLE,
  DIGESTS_HELP_SOURCES,
  DIGESTS_HELP_SOURCES_INTRO,
} from "@/lib/digests-help-evidence-copy";
import {
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE,
  RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE,
  RECURRENCE_SCHEDULES_HELP_SOURCES,
  RECURRENCE_SCHEDULES_HELP_SOURCES_INTRO,
} from "@/lib/recurrence-schedules-help-evidence-copy";
import {
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE,
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
  ROI_SUMMARY_HELP_SOURCES_INTRO,
} from "@/lib/roi-summary-help-evidence-copy";
import {
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_HELP_SOURCES,
  BASELINE_SETTINGS_HELP_SOURCES_INTRO,
} from "@/lib/baseline-settings-help-evidence-copy";
import {
  API_KEYS_HELP_CLAIM_DISCIPLINE,
  API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING,
  API_KEYS_HELP_FOLLOW_UPS_TITLE,
  API_KEYS_HELP_SOURCES,
  API_KEYS_HELP_SOURCES_INTRO,
} from "@/lib/api-keys-help-evidence-copy";
import {
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE,
  SYSTEM_HEALTH_HELP_SOURCES,
  SYSTEM_HEALTH_HELP_SOURCES_INTRO,
} from "@/lib/system-health-help-evidence-copy";
import {
  AI_USAGE_HELP_CLAIM_DISCIPLINE,
  AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING,
  AI_USAGE_HELP_FOLLOW_UPS_TITLE,
  AI_USAGE_HELP_SOURCES,
  AI_USAGE_HELP_SOURCES_INTRO,
} from "@/lib/ai-usage-help-evidence-copy";
import {
  PREFERENCES_HELP_CLAIM_DISCIPLINE,
  PREFERENCES_HELP_FOLLOW_UPS_TITLE,
  PREFERENCES_HELP_SOURCES,
  PREFERENCES_HELP_SOURCES_INTRO,
} from "@/lib/preferences-help-evidence-copy";
import {
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE,
  NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE,
  NOTIFICATIONS_HELP_SOURCES,
  NOTIFICATIONS_HELP_SOURCES_INTRO,
} from "@/lib/notifications-help-evidence-copy";
import {
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_DRAFTS_HELP_SOURCES,
  ARCHITECTURE_DRAFTS_HELP_SOURCES_INTRO,
} from "@/lib/architecture-drafts-help-evidence-copy";
import {
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING,
  EVIDENCE_GRAPH_HELP_FOLLOW_UPS_TITLE,
  EVIDENCE_GRAPH_HELP_SOURCES,
  EVIDENCE_GRAPH_HELP_SOURCES_INTRO,
} from "@/lib/evidence-graph-help-evidence-copy";
import { EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID } from "@/lib/evidence-graph-help-guide-content";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import {
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE,
  SEARCH_REVIEW_EVIDENCE_HELP_FOLLOW_UPS_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_SOURCES,
  SEARCH_REVIEW_EVIDENCE_HELP_SOURCES_INTRO,
} from "@/lib/search-review-evidence-help-evidence-copy";
import {
  JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_HELP_SOURCES,
  JIRA_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/jira-integration-help-evidence-copy";
import {
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE,
  MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_HELP_SOURCES,
  MODEL_GOVERNANCE_HELP_SOURCES_INTRO,
} from "@/lib/model-governance-help-evidence-copy";
import {
  SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_HELP_SOURCES,
  SERVICENOW_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/servicenow-integration-help-evidence-copy";
import {
  SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE,
  SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE,
  SPONSOR_DASHBOARD_HELP_SOURCES,
  SPONSOR_DASHBOARD_HELP_SOURCES_INTRO,
} from "@/lib/sponsor-dashboard-help-evidence-copy";
import {
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  WORKSPACE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  WORKSPACE_SETTINGS_HELP_SOURCES,
  WORKSPACE_SETTINGS_HELP_SOURCES_INTRO,
} from "@/lib/workspace-settings-help-evidence-copy";
import {
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
  ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import {
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE,
  CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_HELP_SOURCES,
  CONNECTION_STATUS_HELP_SOURCES_INTRO,
} from "@/lib/connection-status-help-evidence-copy";
import {
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE,
  DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE,
  DECISION_REGISTER_HELP_SOURCES,
  DECISION_REGISTER_HELP_SOURCES_INTRO,
} from "@/lib/decision-register-help-evidence-copy";
import {
  IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE,
  IMPROVEMENT_PLANNING_HELP_FOLLOW_UPS_TITLE,
  IMPROVEMENT_PLANNING_HELP_SOURCES,
  IMPROVEMENT_PLANNING_HELP_SOURCES_INTRO,
} from "@/lib/improvement-planning-help-evidence-copy";
import {
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE,
  IMPACT_PREVIEW_HELP_FOLLOW_UPS_TITLE,
  IMPACT_PREVIEW_HELP_SOURCES,
  IMPACT_PREVIEW_HELP_SOURCES_INTRO,
} from "@/lib/impact-preview-help-evidence-copy";
import {
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE,
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING,
  ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE,
  ADVISORY_SCANS_HELP_SOURCES,
  ADVISORY_SCANS_HELP_SOURCES_INTRO,
} from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_HELP_CLAIM_HEADING_ID } from "@/lib/advisory-scans-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_HELP_SOURCES,
  SLACK_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/slack-integration-help-evidence-copy";
import {
  STANDARDS_RULES_HELP_CLAIM_DISCIPLINE,
  STANDARDS_RULES_HELP_FOLLOW_UPS_TITLE,
  STANDARDS_RULES_HELP_SOURCES,
  STANDARDS_RULES_HELP_SOURCES_INTRO,
} from "@/lib/standards-rules-help-evidence-copy";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_RELATED_PAGES_TITLE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
  ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO,
} from "@/lib/enterprise-onboarding-help-evidence-copy";
import {
  FINDINGS_HELP_CLAIM_DISCIPLINE,
  FINDINGS_HELP_SOURCES,
  FINDINGS_HELP_SOURCES_INTRO,
} from "@/lib/findings/findings-help-evidence-copy";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_SOURCES,
  INTEGRATION_READINESS_HELP_SOURCES_INTRO,
} from "@/lib/integration-readiness-help-evidence-copy";
import {
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE,
  PILOT_FEEDBACK_HELP_SOURCES,
  PILOT_FEEDBACK_HELP_SOURCES_INTRO,
} from "@/lib/pilot-feedback-help-evidence-copy";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO,
} from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import {
  POLICY_PACKS_HELP_CLAIM_DISCIPLINE,
  POLICY_PACKS_HELP_SOURCES,
  POLICY_PACKS_HELP_SOURCES_INTRO,
} from "@/lib/policy/policy-packs-help-evidence-copy";
import {
  REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
  REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO,
} from "@/lib/repeat-review-loop-help-evidence-copy";
import {
  REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE,
  REPORT_A_PROBLEM_HELP_SOURCES,
  REPORT_A_PROBLEM_HELP_SOURCES_INTRO,
} from "@/lib/report-a-problem-help-evidence-copy";
import {
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
  SECURITY_TRUST_HELP_SOURCES,
  SECURITY_TRUST_HELP_SOURCES_INTRO,
} from "@/lib/security-trust-help-evidence-copy";
import {
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
  SUBPROCESSORS_HELP_SOURCES,
  SUBPROCESSORS_HELP_SOURCES_INTRO,
} from "@/lib/subprocessors-help-evidence-copy";
import {
  TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  TEAMS_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  TEAMS_INTEGRATION_HELP_SOURCES,
  TEAMS_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/teams-integration-help-evidence-copy";
import {
  TEAMS_INTEGRATION_CLAIM_DISCIPLINE,
  TEAMS_INTEGRATION_SOURCES,
  TEAMS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/teams-integration-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
  WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/webhooks-integration-help-evidence-copy";
import {
  ITSM_OAUTH_CALLBACK_CLAIM_DISCIPLINE,
  ITSM_OAUTH_CALLBACK_SOURCES,
  ITSM_OAUTH_CALLBACK_SOURCES_INTRO,
} from "@/lib/itsm/itsm-oauth-callback-evidence-copy";

export function AuditTrailHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="audit-trail-help"
      claimTestId="help-audit-trail-claim-discipline"
      claim={AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={AUDIT_TRAIL_HELP_SOURCES_INTRO}
      sources={AUDIT_TRAIL_HELP_SOURCES}
    />
  );
}

export function AuthenticationSignInHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="authentication-sign-in-help"
      claim={AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO}
      sources={AUTHENTICATION_SIGN_IN_HELP_SOURCES}
    />
  );
}

export function ComparisonReplayHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="comparison-replay-help"
      claim={COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={COMPARISON_REPLAY_HELP_SOURCES_INTRO}
      sources={COMPARISON_REPLAY_HELP_SOURCES}
    />
  );
}

export function ConnectAwsSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connect-aws-securely-help"
      claim={CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE}
      sourcesIntro={CONNECT_AWS_SECURELY_SOURCES_INTRO}
      sources={CONNECT_AWS_SECURELY_SOURCES}
    />
  );
}

export function ConnectAzureSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connect-azure-securely-help"
      claim={CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE}
      sourcesIntro={CONNECT_AZURE_SECURELY_SOURCES_INTRO}
      sources={CONNECT_AZURE_SECURELY_SOURCES}
    />
  );
}

export function DigestsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-digests"
      claim={DIGESTS_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={DIGESTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={DIGESTS_HELP_SOURCES_INTRO}
      sources={DIGESTS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function RecurrenceSchedulesHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-recurrence-schedules"
      claim={RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={RECURRENCE_SCHEDULES_HELP_SOURCES_INTRO}
      sources={RECURRENCE_SCHEDULES_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function RoiSummaryHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-roi-summary"
      claim={ROI_SUMMARY_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ROI_SUMMARY_HELP_SOURCES_INTRO}
      sources={ROI_SUMMARY_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ArchitectureScorecardHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="help-architecture-scorecard-orientation">
      <EvidenceOrientationSourcesSection
        testId="help-architecture-scorecard-sources"
        headingId="related-evidence-and-sources"
        title={ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE}
        intro={ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO}
        links={ARCHITECTURE_SCORECARD_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
      />
    </EvidenceOrientationStripShell>
  );
}

export function ConnectionStatusHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-connection-status"
      claim={CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECTION_STATUS_HELP_SOURCES_INTRO}
      sources={CONNECTION_STATUS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function StandardsRulesHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-standards-rules"
      claim={STANDARDS_RULES_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={STANDARDS_RULES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={STANDARDS_RULES_HELP_SOURCES_INTRO}
      sources={STANDARDS_RULES_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export type BaselineSettingsHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function BaselineSettingsHelpEvidenceOrientationStrip(
  props: BaselineSettingsHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-baseline-settings"
      claim={BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={BASELINE_SETTINGS_HELP_SOURCES_INTRO}
      sources={BASELINE_SETTINGS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
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
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={API_KEYS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={API_KEYS_HELP_SOURCES_INTRO}
      sources={API_KEYS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function SystemHealthHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-system-health"
      claim={SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SYSTEM_HEALTH_HELP_SOURCES_INTRO}
      sources={SYSTEM_HEALTH_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function AiUsageHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-ai-usage"
      claim={AI_USAGE_HELP_CLAIM_DISCIPLINE}
      claimHeading={AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={AI_USAGE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AI_USAGE_HELP_SOURCES_INTRO}
      sources={AI_USAGE_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function PreferencesHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-preferences"
      claim={PREFERENCES_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={PREFERENCES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PREFERENCES_HELP_SOURCES_INTRO}
      sources={PREFERENCES_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function NotificationsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-notifications"
      claim={NOTIFICATIONS_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={NOTIFICATIONS_HELP_SOURCES_INTRO}
      sources={NOTIFICATIONS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function WorkspaceSettingsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-workspace-settings"
      claim={WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={WORKSPACE_SETTINGS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={WORKSPACE_SETTINGS_HELP_SOURCES_INTRO}
      sources={WORKSPACE_SETTINGS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function SlackIntegrationHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-slack-integration"
      claim={SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SLACK_INTEGRATION_HELP_SOURCES_INTRO}
      sources={SLACK_INTEGRATION_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function TeamsIntegrationHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-teams-integration"
      claim={TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={TEAMS_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={TEAMS_INTEGRATION_HELP_SOURCES_INTRO}
      sources={TEAMS_INTEGRATION_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function WebhooksIntegrationHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-webhooks-integration"
      claim={WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO}
      sources={WEBHOOKS_INTEGRATION_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

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

export function FindingsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="findings-help"
      claimTestId="help-findings-claim-discipline"
      claim={FINDINGS_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={FINDINGS_HELP_SOURCES_INTRO}
      sources={FINDINGS_HELP_SOURCES}
    />
  );
}

export function IntegrationReadinessHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="integration-readiness-help"
      claim={INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={INTEGRATION_READINESS_HELP_SOURCES_INTRO}
      sources={INTEGRATION_READINESS_HELP_SOURCES}
    />
  );
}

const PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE = "Follow-up surfaces";

export function PilotFeedbackHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-pilot-feedback"
      claim={PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE}
      claimElement="div"
      sourcesTitle={PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PILOT_FEEDBACK_HELP_SOURCES_INTRO}
      sources={PILOT_FEEDBACK_HELP_SOURCES}
    />
  );
}

export function PriorManifestRetrievalHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-prior-manifest-retrieval"
      claim={PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE}
      claimElement="div"
      sourcesIntro={PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO}
      sources={PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES}
    />
  );
}

export function PolicyPacksHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="policy-packs-help"
      claim={POLICY_PACKS_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={POLICY_PACKS_HELP_SOURCES_INTRO}
      sources={POLICY_PACKS_HELP_SOURCES}
    />
  );
}

export function RepeatReviewLoopHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="repeat-review-loop-help"
      claim={REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorInfo}
      sourcesIntro={REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO}
      sources={REPEAT_REVIEW_LOOP_HELP_SOURCES}
    />
  );
}

export function ReportProblemHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="report-a-problem-help"
      claim={REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={REPORT_A_PROBLEM_HELP_SOURCES_INTRO}
      sources={REPORT_A_PROBLEM_HELP_SOURCES}
    />
  );
}

export function SecurityTrustHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="security-trust-help"
      claim={SECURITY_TRUST_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={SECURITY_TRUST_HELP_SOURCES_INTRO}
      sources={SECURITY_TRUST_HELP_SOURCES}
    />
  );
}

export function SubprocessorsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="subprocessors-help"
      claim={SUBPROCESSORS_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={SUBPROCESSORS_HELP_SOURCES_INTRO}
      sources={SUBPROCESSORS_HELP_SOURCES}
    />
  );
}

export function TeamsIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="teams-integration"
      claim={TEAMS_INTEGRATION_CLAIM_DISCIPLINE}
      sourcesIntro={TEAMS_INTEGRATION_SOURCES_INTRO}
      sources={TEAMS_INTEGRATION_SOURCES}
    />
  );
}

export function EvidenceGraphHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-evidence-graph"
      claim={EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE}
      claimHeading={EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={EVIDENCE_GRAPH_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={EVIDENCE_GRAPH_HELP_SOURCES_INTRO}
      sources={EVIDENCE_GRAPH_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function SearchReviewEvidenceHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-search-review-evidence"
      claim={SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={SEARCH_REVIEW_EVIDENCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SEARCH_REVIEW_EVIDENCE_HELP_SOURCES_INTRO}
      sources={SEARCH_REVIEW_EVIDENCE_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ArchitectureIntelligenceHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-intelligence"
      claim={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO}
      sources={ARCHITECTURE_INTELLIGENCE_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function SponsorDashboardHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-sponsor-dashboard"
      claim={SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SPONSOR_DASHBOARD_HELP_SOURCES_INTRO}
      sources={SPONSOR_DASHBOARD_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ArchitectureDraftsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-drafts"
      claim={ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_DRAFTS_HELP_SOURCES_INTRO}
      sources={ARCHITECTURE_DRAFTS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ModelGovernanceHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-model-governance"
      claim={MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={MODEL_GOVERNANCE_HELP_SOURCES_INTRO}
      sources={MODEL_GOVERNANCE_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function JiraIntegrationHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-jira-integration"
      claim={JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={JIRA_INTEGRATION_HELP_SOURCES_INTRO}
      sources={JIRA_INTEGRATION_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ServiceNowIntegrationHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-servicenow-integration"
      claim={SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SERVICENOW_INTEGRATION_HELP_SOURCES_INTRO}
      sources={SERVICENOW_INTEGRATION_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ItsmOAuthCallbackEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="itsm-oauth-callback"
      claim={ITSM_OAUTH_CALLBACK_CLAIM_DISCIPLINE}
      sourcesIntro={ITSM_OAUTH_CALLBACK_SOURCES_INTRO}
      sources={ITSM_OAUTH_CALLBACK_SOURCES}
    />
  );
}

export type DecisionRegisterHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function DecisionRegisterHelpEvidenceOrientationStrip(
  props: DecisionRegisterHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-decision-register"
      claim={DECISION_REGISTER_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={DECISION_REGISTER_HELP_SOURCES_INTRO}
      sources={DECISION_REGISTER_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ImprovementPlanningHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-improvement-planning"
      claim={IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={IMPROVEMENT_PLANNING_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={IMPROVEMENT_PLANNING_HELP_SOURCES_INTRO}
      sources={IMPROVEMENT_PLANNING_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export type ImpactPreviewHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ImpactPreviewHelpEvidenceOrientationStrip(
  props: ImpactPreviewHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-impact-preview"
      claim={IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={IMPACT_PREVIEW_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={IMPACT_PREVIEW_HELP_SOURCES_INTRO}
      sources={IMPACT_PREVIEW_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function AdvisoryScansHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-advisory-scans"
      claim={ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE}
      claimHeading={ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ADVISORY_SCANS_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      claimElement="div"
      sourcesTitle={ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ADVISORY_SCANS_HELP_SOURCES_INTRO}
      sources={ADVISORY_SCANS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}
