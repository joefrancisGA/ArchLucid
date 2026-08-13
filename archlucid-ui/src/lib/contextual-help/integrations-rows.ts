/** Integration and connector routes (`/integrations/**`, integration-event DLQ). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";

export const INTEGRATIONS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/integrations/cloud-connections",
    entry: {
      whatIsThisPage:
        "Connect Azure, AWS, or Google Cloud for optional read-only evidence collection, or start evidence-only reviews without a cloud connector.",
      whatToDoNext:
        "Choose platforms to show, open a provider to configure federation, or start an evidence-only review from uploaded packages.",
      whyEmpty:
        "Provider cards stay Not connected until you configure a Tier 2 connection; evidence-only upload stays available anytime.",
      whereToConfigurePrerequisite:
        "Choose a workspace in the header scope switcher before changing which platforms appear — filters save per workspace.",
    },
  },
  {
    prefix: "/integrations/cloud-connections/aws",
    entry: {
      whatIsThisPage:
        "AWS cloud connection — configure a read-only federated IAM role for Resource Explorer inventory collection.",
      whatToDoNext:
        "Complete security preflight, enter the role ARN, save the connection, then re-poll to validate access.",
      whyEmpty: "Saved connections and last poll timestamps appear after you save a federated role.",
      whereToConfigurePrerequisite:
        "Creating the IAM trust role usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
    },
  },
  {
    prefix: "/integrations/cloud-connections/azure",
    entry: {
      whatIsThisPage:
        "Azure cloud connection — configure read-only federated service-principal access for subscription inventory collection.",
      whatToDoNext:
        "Complete security preflight, run the Tier 2 wizard, save and validate, then return to Cloud connections for workspace status.",
      whyEmpty: "Saved connections and recent collection runs appear after you validate federated credentials.",
      whereToConfigurePrerequisite:
        "Provisioning the service principal usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
    },
  },
  {
    prefix: "/integrations/cloud-connections/gcp",
    entry: {
      whatIsThisPage:
        "GCP cloud connection — configure read-only Cloud Asset Inventory through Workload Identity Federation.",
      whatToDoNext:
        "Complete security preflight, record the pool provider and service-account email, save the connection, then re-poll to validate access.",
      whyEmpty: "Saved connections and last poll timestamps appear after you save a project.",
      whereToConfigurePrerequisite:
        "Provisioning Workload Identity Federation usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
    },
  },
];
