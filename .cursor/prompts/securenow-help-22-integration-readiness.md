# SH-22 — `/help/integration-readiness`

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Security integration-readiness help matches **Azure connections + Jira + ServiceNow + Teams** (SecureNow Integration nav). Do not recommend Slack or webhooks first. Do not say “not a gate before architecture reviews”. Connection status remains the live-label dest if that page exists in Security.

## Why

`INTEGRATION_READINESS_HELP_OVERVIEW`: “not a gate before architecture reviews… configure recommended chat notifications before optional ITSM destinations.”

Help drawer: “Configure recommended chat connectors first.”

SecureNow nav: Azure connections, Jira, ServiceNow, Teams. Slack and webhooks are Architecture-only. Hub Security summary is closer (“notification, ticketing, and webhook integrations”) — still mentions webhooks; tighten to dests that exist.

## Context

- `archlucid-ui/src/lib/integration-readiness-help-guide-content.ts`
- `archlucid-ui/src/lib/contextual-help/integration-readiness-rows.ts`
- `archlucid-ui/src/lib/product-line/securenow-nav-reshape.ts` — `SECURENOW_INTEGRATION_NAV_HREFS`
- `archlucid-ui/src/lib/help/help-center-catalog-security.ts`
- Live integration-readiness / connection-status pages (read which connectors the Security page actually lists)

## What to build

1. Security overview + first-viewport anchors: Azure inventory connector, then outbound Jira/ServiceNow/Teams. Webhooks/Slack only if the live Security page still shows them (catalog says it should not).
2. Category-1 drawer: Connection status + Azure connections / Jira — not “chat connectors first” if Slack is hidden.
3. Vitest: Security fixtures do not mention architecture reviews or Slack/webhooks unless the live page does.

## Acceptance criteria

- Security help dests ⊆ Security Integration nav + connection-status.
- Architecture help may still mention Slack/webhooks and architecture reviews.

## Constraints

- Do not add Slack/webhooks to SecureNow nav.
- Stage integration-readiness copy + drawer + tests.
