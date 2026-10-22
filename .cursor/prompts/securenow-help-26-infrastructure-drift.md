# SH-26 — Drift workbench `/governance/infrastructure/drift`

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

This page **already has** job-matched Category-1 and Learn more `governance-infrastructure-drift`. This prompt is the remaining **Azure-only** miss in Security.

## Goal

Security drift drawer and `/help/governance-infrastructure-drift` say **Azure inventory snapshots**, not a generic “cloud account” that implies AWS/GCP. Architecture may keep “connect a read-only cloud account”. Do not retarget Learn more to cloud-connections (already correct).

## Why

`governance-infrastructure-drift-rows.ts`: “Connect a read-only cloud account and wait for inventory snapshots”; taskSteps same. Action “Open cloud connections” is OK if the hub is Azure-only after SH-18. Security nav label is Azure connections.

Live lead already Azure-oriented in some overview copy; drawer is generic.

## Context

- `archlucid-ui/src/lib/contextual-help/governance-infrastructure-drift-rows.ts`
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` — drift lead
- `archlucid-ui/src/lib/governance/governance-infrastructure-drift-help-*`
- SH-18 for hub Azure-only

## What to build

1. Product-line-aware `whereToConfigurePrerequisite` / taskSteps / action label: Security = Azure connection or extract-upload; Architecture = Azure, AWS, or GCP.
2. Help article strings that still say “cloud account” without Azure in Security.
3. Vitest: Security drift fixtures include Azure and exclude AWS/GCP; Architecture may name all three.

## Acceptance criteria

- Security F1 does not imply unsupported clouds.
- Learn more remains drift help, not cloud-connections, not Approval.
- Advisory Terraform export honesty unchanged.

## Constraints

- Do not merge terraform workbench (SH-12) into this article.
- Stage drift rows + tests.
