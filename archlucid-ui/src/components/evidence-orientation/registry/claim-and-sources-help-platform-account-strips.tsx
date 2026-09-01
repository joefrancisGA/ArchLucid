/** Claim-then-sources evidence strips for `/help/*` platform account and trust topics. */
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_CLAIM_STYLE,
  EVIDENCE_SOURCES_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  AI_USAGE_HELP_CLAIM_DISCIPLINE,
  AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING,
  AI_USAGE_HELP_FOLLOW_UPS_TITLE,
  AI_USAGE_HELP_SOURCES,
  AI_USAGE_HELP_SOURCES_INTRO,
} from "@/lib/ai-usage-help-evidence-copy";
import { AI_USAGE_HELP_CLAIM_HEADING_ID } from "@/lib/ai-usage-help-guide-content";
import {
  API_KEYS_HELP_CLAIM_DISCIPLINE,
  API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING,
  API_KEYS_HELP_FOLLOW_UPS_TITLE,
  API_KEYS_HELP_SOURCES,
  API_KEYS_HELP_SOURCES_INTRO,
} from "@/lib/api-keys-help-evidence-copy";
import { API_KEYS_HELP_CLAIM_HEADING_ID } from "@/lib/api-keys-help-guide-content";
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
  CONTACT_SUPPORT_HELP_CLAIM_DISCIPLINE,
  CONTACT_SUPPORT_HELP_CLAIM_DISCIPLINE_HEADING,
  CONTACT_SUPPORT_HELP_CLAIM_HEADING_ID,
  CONTACT_SUPPORT_HELP_FOLLOW_UPS_TITLE,
  CONTACT_SUPPORT_HELP_SOURCES,
  CONTACT_SUPPORT_HELP_SOURCES_INTRO,
} from "@/lib/contact-support-help-evidence-copy";
import {
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE,
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE_HEADING,
  NOTIFICATIONS_HELP_CLAIM_HEADING_ID,
  NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE,
  NOTIFICATIONS_HELP_SOURCES,
  NOTIFICATIONS_HELP_SOURCES_INTRO,
} from "@/lib/notifications-help-evidence-copy";
import {
  PREFERENCES_HELP_CLAIM_DISCIPLINE,
  PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING,
  PREFERENCES_HELP_FOLLOW_UPS_TITLE,
  PREFERENCES_HELP_SOURCES,
  PREFERENCES_HELP_SOURCES_INTRO,
} from "@/lib/preferences-help-evidence-copy";
import { PREFERENCES_HELP_CLAIM_HEADING_ID } from "@/lib/preferences-help-guide-content";
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
import {
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  WORKSPACE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  WORKSPACE_SETTINGS_HELP_SOURCES,
  WORKSPACE_SETTINGS_HELP_SOURCES_INTRO,
} from "@/lib/workspace-settings-help-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID } from "@/lib/workspace-settings-help-guide-content";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
      headingClassName={sectionHeadingClass}
    />
  );
}

export function ContactSupportHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="contact-support-help"
      claim={CONTACT_SUPPORT_HELP_CLAIM_DISCIPLINE}
      claimHeading={CONTACT_SUPPORT_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={CONTACT_SUPPORT_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorInfo}
      sourcesTitle={CONTACT_SUPPORT_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={CONTACT_SUPPORT_HELP_SOURCES_INTRO}
      sources={CONTACT_SUPPORT_HELP_SOURCES}
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

export type SubprocessorsHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
  readonly sources?: readonly EvidenceOrientationLink[];
};

export function SubprocessorsHelpEvidenceOrientationStrip(
  props: SubprocessorsHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  const sources = props.sources ?? SUBPROCESSORS_HELP_SOURCES;

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="subprocessors-help"
      claim={SUBPROCESSORS_HELP_CLAIM_DISCIPLINE}
      claimHeading={SUBPROCESSORS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SUBPROCESSORS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={SUBPROCESSORS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SUBPROCESSORS_HELP_SOURCES_INTRO}
      sources={sources}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName}
    />
  );
}
