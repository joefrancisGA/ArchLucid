/** Administration hub routes (`/administration/**`). */

import type { PageContextualHelpEntry, PageContextualHelpRow } from "@/lib/contextual-help/types";

/** Exact Settings hub root (`/administration`) — registered via parameterized matcher so children keep their own answers. */
export const SETTINGS_HUB_CONTEXTUAL_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Settings hub — search and open workspace, governance, integration, security, billing, and support configuration pages.",
  whatToDoNext:
    "Search or jump to a section, then open a destination page to change settings. Use the help control for short answers about this index.",
  whyEmpty:
    "Sections appear based on your authority and search; try clearing search or showing advanced settings when a destination is missing.",
  whereToConfigurePrerequisite:
    "Some destinations require Admin or Operator authority; personal preferences stay in the account menu.",
};

export const ADMINISTRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/administration/developer",
    entry: {
      whatIsThisPage:
        "Internal developer tools - evaluate branded themes and try CLI demos for workspace diagnostics; not part of the customer settings navigation.",
      whatToDoNext:
        "Use the theme selector for visual evaluation, try the CLI demo card when validating local tooling, then open Engineering troubleshooting or System health for live runbooks.",
      whyEmpty:
        "Theme and CLI cards always render for authorized architects; empty results only appear inside the CLI demo after a command returns no output.",
      whereToConfigurePrerequisite:
        "Requires an authenticated Admin session with advanced/developer route access; customer settings hubs do not deep-link here.",
    },
  },
  {
    prefix: "/administration/users/invite-reviewer",
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
    prefix: "/administration/users",
    entry: {
      whatIsThisPage:
        "Invite users and assign ArchLucid app roles for this workspace tenant.",
      whatToDoNext:
        "Invite a teammate, then open Roles and permissions to adjust authority.",
      whyEmpty: "Directory rows appear after invitations are accepted or users are provisioned for this tenant.",
      whereToConfigurePrerequisite:
        "SSO and identity-provider mapping may be required before enterprise users can sign in.",
    },
  },
  {
    prefix: "/administration/extract-upload",
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
    prefix: "/administration/security-trust",
    entry: {
      whatIsThisPage:
        "Operator Security & Trust — procurement-oriented materials, tenant isolation posture, retention notes, and NDA-gated diligence requests for this workspace.",
      whatToDoNext:
        "Open Assurance status or Trust Center for assurance surfaces, or Audit when you need governed activity trails.",
      whyEmpty:
        "Public materials list here when published; NDA-gated packs require contacting security@archlucid.net.",
      whereToConfigurePrerequisite:
        "No workspace toggle is required — this page orients architects to published and NDA diligence paths.",
    },
  },
  {
    prefix: "/administration/billing",
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
];
