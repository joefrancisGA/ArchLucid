/** Claim-then-sources evidence strips for ITSM, chat, and cloud-connection integration surfaces. */
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EvidenceOrientationClaimCallout,
} from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import {
  EvidenceOrientationSourcesSection,
} from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import {
  EvidenceOrientationStripShell,
} from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import {
  CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE,
  CLOUD_CONNECTIONS_SOURCES,
  CLOUD_CONNECTIONS_SOURCES_INTRO,
} from "@/lib/cloud-connections-evidence-copy";
import {
  EVIDENCE_CLAIM_STYLE,
  EVIDENCE_SOURCES_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE,
  AZURE_BOARDS_INTEGRATION_SOURCES,
  AZURE_BOARDS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/azure-boards-integration-evidence-copy";
import {
  JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_HELP_SOURCES,
  JIRA_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/jira-integration-help-evidence-copy";
import { JIRA_INTEGRATION_HELP_CLAIM_HEADING_ID } from "@/lib/jira-integration-help-guide-content";
import {
  JIRA_INTEGRATION_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_SOURCES,
  JIRA_INTEGRATION_SOURCES_INTRO,
} from "@/lib/jira-integration-evidence-copy";
import {
  SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_SOURCES,
  SERVICENOW_INTEGRATION_SOURCES_INTRO,
} from "@/lib/servicenow-integration-evidence-copy";
import {
  SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_HELP_SOURCES,
  SERVICENOW_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/servicenow-integration-help-evidence-copy";
import {
  SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID,
} from "@/lib/servicenow-integration-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_HELP_SOURCES,
  SLACK_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/slack-integration-help-evidence-copy";
import { SLACK_INTEGRATION_HELP_CLAIM_HEADING_ID } from "@/lib/slack-integration-help-guide-content";
import {
  SLACK_INTEGRATION_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_SOURCES,
  SLACK_INTEGRATION_SOURCES_INTRO,
} from "@/lib/slack-integration-evidence-copy";
import {
  TEAMS_INTEGRATION_HELP_ALERT_RULES_HREF,
  TEAMS_INTEGRATION_HELP_ALTERNATIVE_SOURCES,
  TEAMS_INTEGRATION_HELP_ALTERNATIVES_TITLE,
  TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  TEAMS_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  TEAMS_INTEGRATION_HELP_SOURCES,
  TEAMS_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/teams-integration-help-evidence-copy";
import { TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID } from "@/lib/teams-integration-help-guide-content";
import {
  TEAMS_INTEGRATION_FOLLOW_UPS_TITLE,
  TEAMS_INTEGRATION_SOURCES,
  TEAMS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/teams-integration-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
  WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/webhooks-integration-help-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_ALERT_RULES_HREF,
  WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
} from "@/lib/webhooks-integration-help-guide-content";
import {
  WEBHOOKS_INTEGRATION_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_SOURCES,
  WEBHOOKS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/webhooks-integration-evidence-copy";
import {
  ITSM_OAUTH_CALLBACK_FOLLOW_UPS_TITLE,
  ITSM_OAUTH_CALLBACK_SOURCES,
  ITSM_OAUTH_CALLBACK_SOURCES_INTRO,
} from "@/lib/itsm/itsm-oauth-callback-evidence-copy";

export type SlackIntegrationHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function SlackIntegrationHelpEvidenceOrientationStrip(
  props: SlackIntegrationHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-slack-integration"
      claim={SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimHeading={SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SLACK_INTEGRATION_HELP_CLAIM_HEADING_ID}
      sourcesTitle={SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SLACK_INTEGRATION_HELP_SOURCES_INTRO}
      sources={SLACK_INTEGRATION_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function SlackIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="slack-integration"
      sourcesTitle={SLACK_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={SLACK_INTEGRATION_SOURCES_INTRO}
      sources={SLACK_INTEGRATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export type TeamsIntegrationHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function TeamsIntegrationHelpEvidenceOrientationStrip(
  props: TeamsIntegrationHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  const sectionHeadingClass = cn(
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    OPERATOR_TYPOGRAPHY.sectionTitle,
    "m-0 scroll-mt-24",
  );

  return (
    <EvidenceOrientationStripShell testId="help-teams-integration-orientation">
      <EvidenceOrientationClaimCallout
        testId="help-teams-integration-claim-discipline"
        stripSlug="help-teams-integration"
        body={TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE}
        style={EVIDENCE_CLAIM_STYLE.operatorNeutral}
        element="div"
        bodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
        headingClassName={sectionHeadingClass}
        heading={{
          text: TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
          id: TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID,
        }}
      />

      <EvidenceOrientationSourcesSection
        testId="help-teams-integration-sources"
        headingId="where-to-go-next"
        title={TEAMS_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
        intro={TEAMS_INTEGRATION_HELP_SOURCES_INTRO}
        links={TEAMS_INTEGRATION_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="stacked"
        listClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
        headingClassName={sectionHeadingClass}
        distinguishFollowUpDestinations
        promotedSourceHref={TEAMS_INTEGRATION_HELP_ALERT_RULES_HREF}
      />

      <EvidenceOrientationSourcesSection
        testId="help-teams-integration-alternative-sources"
        headingId="help-teams-integration-alternative-sources-heading"
        title={TEAMS_INTEGRATION_HELP_ALTERNATIVES_TITLE}
        intro="Compare sibling notification channels when Teams is not the only destination under review."
        links={TEAMS_INTEGRATION_HELP_ALTERNATIVE_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="stacked"
        listClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
        headingClassName={cn(OPERATOR_TYPOGRAPHY.cardTitle, "m-0")}
        distinguishFollowUpDestinations
      />
    </EvidenceOrientationStripShell>
  );
}

export type WebhooksIntegrationHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function WebhooksIntegrationHelpEvidenceOrientationStrip(
  props: WebhooksIntegrationHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-webhooks-integration"
      claim={WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimHeading={WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID}
      sourcesTitle={WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO}
      sources={WEBHOOKS_INTEGRATION_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
      promotedSourceHref={WEBHOOKS_INTEGRATION_HELP_ALERT_RULES_HREF}
    />
  );
}

export function WebhooksIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="webhooks-integration"
      sourcesTitle={WEBHOOKS_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={WEBHOOKS_INTEGRATION_SOURCES_INTRO}
      sources={WEBHOOKS_INTEGRATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function TeamsIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="teams-integration"
      sourcesTitle={TEAMS_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={TEAMS_INTEGRATION_SOURCES_INTRO}
      sources={TEAMS_INTEGRATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function AzureBoardsIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="azure-boards-integration"
      sourcesTitle={AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={AZURE_BOARDS_INTEGRATION_SOURCES_INTRO}
      sources={AZURE_BOARDS_INTEGRATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function CloudConnectionsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="cloud-connections"
      sourcesTitle={CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE}
      sourcesIntro={CLOUD_CONNECTIONS_SOURCES_INTRO}
      sources={CLOUD_CONNECTIONS_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export type JiraIntegrationHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function JiraIntegrationHelpEvidenceOrientationStrip(
  props: JiraIntegrationHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-jira-integration"
      claim={JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimHeading={JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={JIRA_INTEGRATION_HELP_CLAIM_HEADING_ID}
      sourcesTitle={JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={JIRA_INTEGRATION_HELP_SOURCES_INTRO}
      sources={JIRA_INTEGRATION_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function JiraIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="jira-integration"
      sourcesTitle={JIRA_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={JIRA_INTEGRATION_SOURCES_INTRO}
      sources={JIRA_INTEGRATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ServiceNowIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="servicenow-integration"
      sourcesTitle={SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={SERVICENOW_INTEGRATION_SOURCES_INTRO}
      sources={SERVICENOW_INTEGRATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export type ServiceNowIntegrationHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ServiceNowIntegrationHelpEvidenceOrientationStrip(
  props: ServiceNowIntegrationHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-servicenow-integration"
      claim={SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimHeading={SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorInlineNote}
      sourcesTitle={SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SERVICENOW_INTEGRATION_HELP_SOURCES_INTRO}
      sources={SERVICENOW_INTEGRATION_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ItsmOAuthCallbackEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="itsm-oauth-callback"
      sourcesTitle={ITSM_OAUTH_CALLBACK_FOLLOW_UPS_TITLE}
      sourcesIntro={ITSM_OAUTH_CALLBACK_SOURCES_INTRO}
      sources={ITSM_OAUTH_CALLBACK_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}
