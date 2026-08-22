/** Workspace administration settings surfaces and matching help topics. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  BILLING_AND_PLANS_HELP_CANONICAL_PATH,
  BILLING_AND_PLANS_HELP_TOPIC_LABEL,
} from "@/lib/billing-and-plans-help-evidence-copy";
import {
  EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
  EXTRACT_UPLOAD_SETTINGS_HELP_TOPIC_LABEL,
} from "@/lib/extract-upload-settings-evidence-copy";
import {
  INVITE_REVIEWER_CANONICAL_PATH,
  INVITE_REVIEWER_HELP_TOPIC_LABEL,
} from "@/lib/invite-reviewer-evidence-copy";
import {
  OPERATOR_BILLING_SETTINGS_CANONICAL_PATH,
  OPERATOR_BILLING_SETTINGS_HELP_TOPIC_LABEL,
} from "@/lib/operator/operator-billing-settings-evidence-copy";
import {
  SECURITY_TRUST_HELP_CANONICAL_PATH,
  SECURITY_TRUST_HELP_TOPIC_LABEL,
} from "@/lib/security-trust-help-evidence-copy";
import {
  SETTINGS_SECURITY_TRUST_CANONICAL_PATH,
  SETTINGS_SECURITY_TRUST_HELP_TOPIC_LABEL,
} from "@/lib/settings-security-trust-evidence-copy";
import {
  SETTINGS_USERS_CANONICAL_PATH,
  SETTINGS_USERS_HELP_TOPIC_LABEL,
} from "@/lib/settings-users-evidence-copy";
import {
  USERS_AND_ROLES_HELP_CANONICAL_PATH,
  USERS_AND_ROLES_HELP_TOPIC_LABEL,
} from "@/lib/users-and-roles-help-evidence-copy";

export const WORKSPACE_ADMINISTRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: INVITE_REVIEWER_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Invite a reviewer — send Reader or Auditor access so a teammate can sign off on architecture reviews.",
      whatToDoNext:
        "Enter the reviewer's email, send the invitation, then open Users and roles when you need the full directory or role matrix.",
      whyEmpty: "The invitation form is ready when you have Admin authority in this workspace.",
      whereToConfigurePrerequisite:
        "Workspace Admin authority is required; SSO may need to be configured before invited users can sign in.",
    },
  },
  {
    prefix: SETTINGS_USERS_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Invite users and assign ArchLucid app roles for this workspace tenant.",
      whatToDoNext:
        "Invite a teammate, then open Roles and permissions to adjust authority.",
      whyEmpty: "Directory rows appear after invitations are accepted or users are provisioned for this tenant.",
      whereToConfigurePrerequisite:
        "SSO and identity-provider mapping may be required before enterprise users can sign in.",
      taskSteps: [
        "Invite teammates who need access to this workspace.",
        "Open Roles and permissions to adjust authority.",
        "Configure SSO when enterprise users cannot sign in yet.",
      ],
    },
  },
  {
    prefix: EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Extract and Upload - run the read-only Azure extractor locally, validate the ZIP, then upload inventory for architecture reviews.",
      whatToDoNext:
        "Copy the quick-start command, upload a validated ZIP, then open Start a review when the package is ready.",
      whyEmpty:
        "Upload controls are ready when you have Admin or Execute authority; progress rows appear after a package is selected.",
      whereToConfigurePrerequisite:
        "Uploading packages needs workspace authority; cloud connectors are optional for evidence-only ZIP intake.",
    },
  },
  {
    prefix: SETTINGS_SECURITY_TRUST_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Operator Security & Trust — procurement-oriented materials, tenant isolation posture, retention notes, and NDA-gated diligence requests for this workspace.",
      whatToDoNext:
        "Open Assurance status or Trust Center for assurance surfaces, or Audit when you need official activity records.",
      whyEmpty:
        "Public materials list here when published; NDA-gated packs require contacting security@archlucid.net.",
      whereToConfigurePrerequisite:
        "No workspace toggle is required — this page orients architects to published and NDA diligence paths.",
    },
  },
  {
    prefix: OPERATOR_BILLING_SETTINGS_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Billing & plans - view the current subscription, compare available plans, and manage usage and wallet controls for this workspace.",
      whatToDoNext:
        "Review the current plan card, compare Available plans, then open AI usage or Billing help when spend questions need methodology.",
      whyEmpty:
        "Plan and usage cards appear after billing data loads for this tenant; wallet controls need Admin authority to mutate.",
      whereToConfigurePrerequisite:
        "Changing plans or payment methods needs a role that can manage workspace billing.",
    },
  },
  {
    prefix: BILLING_AND_PLANS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Billing and plans — ${BILLING_AND_PLANS_HELP_TOPIC_LABEL.toLowerCase()} for evaluation and paid plans, usage, and invoices.`,
      whatToDoNext:
        "Open Billing settings for this workspace, or Pricing when you need public packaging before changing plans.",
      whyEmpty: "This guide is always available; live plan and usage cards appear after billing data loads.",
      whereToConfigurePrerequisite:
        "Changing plans or payment methods needs a role that can manage workspace billing.",
      whatToDoNextAction: {
        label: "Open Billing settings",
        href: OPERATOR_BILLING_SETTINGS_CANONICAL_PATH,
      },
    },
  },
  {
    prefix: SECURITY_TRUST_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Security and trust help — ${SECURITY_TRUST_HELP_TOPIC_LABEL.toLowerCase()} for assurance, data handling, and diligence materials.`,
      whatToDoNext:
        "Open Assurance status or Trust Center for official materials, or Audit for activity records.",
      whyEmpty: "This guide is always available; downloadable diligence packs appear on Trust Center when published.",
      whereToConfigurePrerequisite:
        "No configuration is required — this page is assurance orientation vocabulary only.",
      whatToDoNextAction: {
        label: "Open Security and trust settings",
        href: SETTINGS_SECURITY_TRUST_CANONICAL_PATH,
      },
    },
  },
  {
    prefix: USERS_AND_ROLES_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Users and roles — ${USERS_AND_ROLES_HELP_TOPIC_LABEL.toLowerCase()} for app roles, capabilities, and invitations.`,
      whatToDoNext:
        "Open Users settings to invite or assign roles, or Assurance status when you need assurance orientation.",
      whyEmpty: "This guide is always available; live directory rows appear after users are invited or provisioned.",
      whereToConfigurePrerequisite:
        "Managing users needs Admin authority; SSO may be required before invited users can sign in.",
      whatToDoNextAction: {
        label: "Open Users settings",
        href: SETTINGS_USERS_CANONICAL_PATH,
      },
    },
  },
];
