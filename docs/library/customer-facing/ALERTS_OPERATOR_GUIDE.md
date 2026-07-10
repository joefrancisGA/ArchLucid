> **Scope:** Customer-facing — governance alerts inbox and alert-rule configuration.

# Alerts

Alerts are governance and architecture-risk signals generated when enabled **alert rules** evaluate findings from finalized review packages.

## What alerts are {#what-alerts-are}

The **Alerts** inbox (`/governance/alerts`) is a triage surface. Each row is a deduplicated signal tied to a finding that may require acknowledgement, resolution, or governance review.

Alerts are not policy packs and are not the same as the **Standards & rules** inspection view (`/governance/resolution`), which shows which standards and policy rules were applied to a specific review package.

## How alerts are generated {#how-alerts-are-generated}

1. An architecture review package is finalized so findings exist in scope.
2. Scheduled or on-demand evaluations run enabled alert rules against those findings.
3. When a rule threshold is met, ArchLucid creates or updates an inbox row (deduplicated across repeated evaluations).

If no alert rules are enabled, the inbox stays empty and **Last evaluated** shows that rules are not configured.

## How rules trigger alerts {#how-rules-trigger-alerts}

**Alert rules** define metric thresholds (for example critical-finding counts or compliance-gap deltas). **Composite rules** combine multiple conditions. **Routing** subscriptions deliver fired alerts to email or webhooks.

Rules are filtered by effective governance before evaluation — disabled or out-of-scope rules do not fire.

## Where to configure rules {#where-to-configure-rules}

Configure alert rules on the **Alert rules** workspace at [`/governance/alert-rules`](/governance/alert-rules):

- **Alert rules** — create and enable threshold rules.
- **Routing** — notification destinations.
- **Composite** — multi-condition rules.
- **Simulation & Tuning** — what-if runs and threshold recommendations.

For policy-pack standards applied during review, use **Policy packs** (`/governance/policy-packs`) or inspect **Standards & rules** on a review (`/governance/resolution`).

For first-time governance setup, see the [**Governance setup guide**](/governance/first-30-days).

## Acknowledge or resolve alerts {#acknowledge-or-resolve-alerts}

On the Alerts inbox:

1. Filter by status (Open, Acknowledged, Resolved).
2. Select rows and **Acknowledge**, or open a row to resolve, waive, or link follow-up actions when your role allows.
3. Use **Refresh** to pull the latest evaluation results.

Triage actions require sufficient workspace authority; readers can view the inbox but may not mutate rows.
