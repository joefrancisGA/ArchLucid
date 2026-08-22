/** Cloud connections integration surfaces and cloud-connections help topics. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  CLOUD_CONNECTIONS_CANONICAL_PATH,
  CLOUD_CONNECTIONS_HELP_TOPIC_LABEL,
} from "@/lib/cloud-connections-evidence-copy";
import { AZURE_PERMISSIONS_HELP_TOPIC_LABEL } from "@/lib/azure-permissions-help-evidence-copy";
import { CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL } from "@/lib/connect-aws-securely-help-evidence-copy";
import { CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL } from "@/lib/connect-gcp-securely-help-evidence-copy";
import { CLOUD_CONNECTIONS_HELP_PATH } from "@/lib/cloud-connections-help-guide-content";
import { CONNECT_AWS_SECURELY_CANONICAL_PATH } from "@/lib/connect-aws-securely-help-evidence-copy";
import { CONNECT_GCP_SECURELY_CANONICAL_PATH } from "@/lib/connect-gcp-securely-help-evidence-copy";
import { AZURE_PERMISSIONS_HELP_CANONICAL_PATH } from "@/lib/azure-permissions-help-evidence-copy";
import { CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL } from "@/lib/cloud-provider-connection-evidence-copy";

const CLOUD_CONNECTIONS_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Connect Azure, AWS, or Google Cloud for optional read-only evidence collection, or start evidence-only reviews without a cloud connector.",
  whatToDoNext:
    "Choose platforms to show, open a provider to configure federation, or start an evidence-only review from uploaded packages.",
  whyEmpty:
    "Provider cards stay Not connected until you configure a Tier 2 connection; evidence-only upload stays available anytime.",
  whereToConfigurePrerequisite:
    "Choose a workspace in the header scope switcher before changing which platforms appear — filters save per workspace.",
} as const;

const AWS_CLOUD_CONNECTION_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "AWS cloud connection — configure a read-only federated IAM role for Resource Explorer inventory collection.",
  whatToDoNext:
    "Complete security preflight, enter the role ARN, save the connection, then re-poll to validate access.",
  whyEmpty: "Saved connections and last poll timestamps appear after you save a federated role.",
  whereToConfigurePrerequisite:
    "Creating the IAM trust role usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
} as const;

const AZURE_CLOUD_CONNECTION_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Azure cloud connection — configure read-only federated service-principal access for subscription inventory collection.",
  whatToDoNext:
    "Complete security preflight, run the Tier 2 wizard, save and validate, then return to Cloud connections for workspace status.",
  whyEmpty: "Saved connections and recent collection runs appear after you validate federated credentials.",
  whereToConfigurePrerequisite:
    "Provisioning the service principal usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
  taskSteps: [
    "Complete security preflight for the target subscription.",
    "Run the Tier 2 wizard and assign the documented read-only Azure roles.",
    "Save, validate the connection, then return to Cloud connections for workspace status.",
  ],
} as const;

const GCP_CLOUD_CONNECTION_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "GCP cloud connection — configure read-only Cloud Asset Inventory through Workload Identity Federation.",
  whatToDoNext:
    "Complete security preflight, record the pool provider and service-account email, save the connection, then re-poll to validate access.",
  whyEmpty: "Saved connections and last poll timestamps appear after you save a project.",
  whereToConfigurePrerequisite:
    "Provisioning Workload Identity Federation usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
} as const;

export const CLOUD_CONNECTIONS_INTEGRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: CLOUD_CONNECTIONS_CANONICAL_PATH,
    entry: CLOUD_CONNECTIONS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/integrations/cloud-connections/aws",
    entry: AWS_CLOUD_CONNECTION_CONTEXTUAL_HELP,
  },
  {
    prefix: "/integrations/cloud-connections/azure",
    entry: AZURE_CLOUD_CONNECTION_CONTEXTUAL_HELP,
  },
  {
    prefix: "/integrations/cloud-connections/gcp",
    entry: GCP_CLOUD_CONNECTION_CONTEXTUAL_HELP,
  },
  {
    prefix: CLOUD_CONNECTIONS_HELP_PATH,
    entry: {
      whatIsThisPage: `Cloud connections help — ${CLOUD_CONNECTIONS_HELP_TOPIC_LABEL.toLowerCase()} for optional Azure, AWS, and GCP connectors.`,
      whatToDoNext:
        "Open the Cloud connections hub to configure a provider, or read Connect Azure securely for federation steps.",
      whyEmpty: "This guide is always available; live connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "Cloud connectors are optional — evidence-only reviews work without attaching a cloud account.",
      whatToDoNextAction: {
        label: "Open Cloud connections hub",
        href: CLOUD_CONNECTIONS_CANONICAL_PATH,
      },
    },
  },
  {
    prefix: "/help/cloud-connections/azure",
    entry: {
      whatIsThisPage: `Connect Azure securely — ${CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL.toLowerCase()} with workload identity federation and read-only roles.`,
      whatToDoNext:
        "Follow the federation steps, then open the Azure cloud connection wizard to validate the attachment.",
      whyEmpty: "This guide is always available; live Azure connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "Azure attachment is optional — evidence-only reviews work without a cloud connector.",
      whatToDoNextAction: {
        label: "Open Azure connection settings",
        href: "/integrations/cloud-connections/azure",
      },
    },
  },
  {
    prefix: CONNECT_AWS_SECURELY_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Connect AWS securely — ${CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL.toLowerCase()} with OIDC-federated read-only IAM.`,
      whatToDoNext:
        "Follow the federation steps, then open the AWS cloud connection settings to validate the attachment.",
      whyEmpty: "This guide is always available; live AWS connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "AWS attachment is optional — evidence-only reviews work without a cloud connector.",
      whatToDoNextAction: {
        label: "Open AWS connection settings",
        href: "/integrations/cloud-connections/aws",
      },
      whereToConfigureAction: {
        label: "Open Cloud connections help",
        href: CLOUD_CONNECTIONS_HELP_PATH,
      },
    },
  },
  {
    prefix: CONNECT_GCP_SECURELY_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Connect GCP securely — ${CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL.toLowerCase()} with Workload Identity Federation.`,
      whatToDoNext:
        "Follow the federation steps, then open the GCP cloud connection settings to validate the attachment.",
      whyEmpty: "This guide is always available; live GCP connection status appears on the Cloud connections hub.",
      whereToConfigurePrerequisite:
        "GCP attachment is optional — evidence-only reviews work without a cloud connector.",
      whatToDoNextAction: {
        label: "Open GCP connection settings",
        href: "/integrations/cloud-connections/gcp",
      },
      whereToConfigureAction: {
        label: "Open Cloud connections help",
        href: CLOUD_CONNECTIONS_HELP_PATH,
      },
    },
  },
  {
    prefix: AZURE_PERMISSIONS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Azure permissions — ${AZURE_PERMISSIONS_HELP_TOPIC_LABEL.toLowerCase()} for read-only roles, scopes, and verification.`,
      whatToDoNext:
        "Open Cloud connections to configure Azure, or Connect Azure securely when you need the federation walkthrough.",
      whyEmpty: "This guide is always available; live permission checks appear after you configure an Azure connection.",
      whereToConfigurePrerequisite:
        "Assigning Azure roles needs cloud-admin authority in the target subscription.",
      whatToDoNextAction: {
        label: "Open Azure connection settings",
        href: "/integrations/cloud-connections/azure",
      },
    },
  },
];
