> **Scope:** Customer-facing — integration readiness overview for notification, ticketing, publishing, and delivery connectors.

# Integration readiness

The **Connection status** page (`/administration/connection-status`) shows which notification, ticketing, publishing, and delivery integrations are configured for the current workspace — and what to set up first when you want them.

## What integration readiness means {#what-integration-readiness-means}

Integration readiness is a **health and setup-priority overview**, not a prerequisite gate for architecture reviews. It answers:

- Which connectors are ready to use today
- Which setups ArchLucid recommends for most teams
- Which integrations are optional until your operating model needs them
- Which integrations are disabled for this deployment

You can complete first-review value — evidence intake, findings, finalize, and sponsor exports — **without** configuring any integration on this page.

## Status labels {#status-labels}

| Label | Meaning |
| --- | --- |
| **Ready** | Configuration is complete enough for this workspace scope. |
| **Recommended** | ArchLucid suggests setting this up when stakeholders should receive review outcomes in chat (for example Microsoft Teams or Slack). |
| **Optional** | Useful when your workflow needs it, but not required for standard review workflows. |
| **Not configured** | No setup has been started for this connector. |
| **Disabled** | Turned off for this deployment — configuration is unavailable until an administrator re-enables it. |
| **Needs attention** | Setup was started or a smoke check failed — finish configuration or resolve the reported issue. |

**Background delivery** (integration event bus) uses plain-language summary labels on the page:

- **Configured** — asynchronous event delivery is wired for this deployment.
- **Not configured** — delivery was started but is incomplete.
- **Not required** — standard review workflows do not need background delivery.

## Recommended versus optional {#recommended-versus-optional}

**Recommended** integrations help teams see review outcomes where they already work:

- **Microsoft Teams** and **Slack** — review and alert notifications to a channel.

**Optional** integrations support extended operating models:

- **Jira** and **ServiceNow** — create backlog or incident records from findings.
- **Confluence** — publish review artifacts to a knowledge base.
- **Architecture digests** — recurring architecture summaries to stakeholders.
- **Outbound HTTP webhooks** — custom HTTPS event delivery.

Configure recommended connectors first when notifications matter; add optional connectors only when your workflow needs them.

## Where to configure each integration {#where-to-configure}

| Integration | Setup page |
| --- | --- |
| Microsoft Teams | [`/integrations/teams`](/integrations/teams) |
| Slack | [`/integrations/slack`](/integrations/slack) |
| Jira | [`/integrations/jira`](/integrations/jira) |
| ServiceNow | [`/integrations/servicenow`](/integrations/servicenow) |
| Confluence publishing | Admin ITSM connectors (when enabled for your deployment) |
| Architecture digests | [`/architecture/digests`](/architecture/digests) (schedules and digest subscriptions) |
| Outbound HTTP webhooks | [`/integrations/webhooks`](/integrations/webhooks) |

Open **Integration readiness** anytime from **Administration → Integration readiness** or links on integration setup pages.

## Do reviews require integrations? {#reviews-and-integrations}

**No.** Standard architecture review workflows do not require Teams, Slack, Jira, ServiceNow, digests, webhooks, or background delivery.

Use integrations when you want notifications, ticket handoff, publishing, or custom automation — not as a blocker before first review value.
