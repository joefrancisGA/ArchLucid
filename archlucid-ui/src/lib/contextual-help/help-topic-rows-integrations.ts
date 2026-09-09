/** Integrations, admin diagnostics, and engineering help topics (`/help/**`). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";

export const HELP_TOPIC_CONTEXTUAL_HELP_ROWS_INTEGRATIONS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/help/configuration-reference",
    entry: {
      whatIsThisPage:
        "Admin configuration task guide for SSO, identity providers, and production-like hosting posture.",
      whatToDoNext:
        "Open the matching settings CTA (SSO or identity providers), then expand the key catalog appendix only if needed.",
      whyEmpty: "This guide always shows configuration tasks when the help topic loads.",
      whereToConfigurePrerequisite: "Admin access to identity settings and the configuration summary.",
      taskSteps: [
        "Open the matching SSO or identity providers CTA.",
        "Complete required configuration tasks in order.",
        "Expand the key catalog appendix only when needed.",
      ],
    },
  },
  {
    prefix: "/help/cli-usage",
    entry: {
      whatIsThisPage:
        "CLI usage engineering runbook — non-interactive archlucid commands, environment variables, exit codes, and API starter fixtures.",
      whatToDoNext:
        "Prefer customer Troubleshooting and System health first, then use CLI detail; open engineering troubleshooting when logs need deeper triage.",
      whyEmpty: "This reference always shows when the help topic loads.",
      whereToConfigurePrerequisite:
        "CLI and API automation need credentials and workspace scope configured for the target environment.",
      taskSteps: [
        "Start with customer Troubleshooting and System health.",
        "Use CLI commands for non-interactive automation.",
        "Open engineering troubleshooting when logs need deeper triage.",
      ],
    },
  },
  {
    prefix: "/help/engineering-troubleshooting",
    entry: {
      whatIsThisPage:
        "Admin engineering troubleshooting runbook for CLI, environment, and log triage after customer Troubleshooting.",
      whatToDoNext:
        "Prefer Customer Troubleshooting and System health first, then use eng CLI/env detail; open Report a problem when filing a ticket.",
      whyEmpty: "This runbook always shows when the help topic loads for Admins.",
      whereToConfigurePrerequisite: "Admin access; Architects should use the customer Troubleshooting guide instead.",
      taskSteps: [
        "Confirm customer Troubleshooting steps were tried first.",
        "Use engineering CLI and environment detail here.",
        "Open Report a problem when filing a ticket.",
      ],
    },
  },
  {
    prefix: "/help/api-contracts",
    entry: {
      whatIsThisPage:
        "Admin HTTP and OpenAPI contract reference for integrators — not the buyer approval FAQ.",
      whatToDoNext:
        "Open CLI usage for tooling, or approval if you need buyer approval workflows.",
      whyEmpty: "Orientation and stripped contract reference always show when this Admin help topic loads.",
      whereToConfigurePrerequisite: "Admin access; treat OpenAPI as the contract of record when prose disagrees.",
      taskSteps: [
        "Read orientation for HTTP and OpenAPI scope.",
        "Open CLI usage when tooling setup is needed.",
        "Open Approval help for buyer approval workflows.",
      ],
    },
  },
  {
    prefix: "/help/admin-diagnostics",
    entry: {
      whatIsThisPage:
        "Admin diagnostics — system status, workspace readiness, assistant diagnostics, and observability signals for platform health.",
      whatToDoNext:
        "Open System health for live probes, or Engineering troubleshooting when CLI and log triage are required.",
      whyEmpty: "This guide is always available; live probe tiles appear on System health after the workspace responds.",
      whereToConfigurePrerequisite:
        "Deep diagnostics often require ArchLucid personnel or admin roles; customer tenants use Troubleshooting first.",
      whatToDoNextAction: {
        label: "Open System health",
        href: "/administration/system-health",
      },
      whereToConfigureAction: {
        label: "Open Engineering troubleshooting",
        href: "/help/engineering-troubleshooting",
      },
      taskSteps: [
        "Open System health for live probe tiles.",
        "Use this guide for assistant and observability context.",
        "Open Engineering troubleshooting for CLI and log triage.",
      ],
    },
  },
];
