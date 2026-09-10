# SH-21 — `/help/data-handling` (and Category-1 on that article)

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

Legal company **ArchLucid** stays on subprocessors/DPA. This prompt is **product data-flow** job match for SecureNow.

## Goal

Security data-handling article describes how **SecureNow** handles cloud inventory evidence, findings, tenant isolation, and AI provider processing — not “architecture brief text” / “finalized review records / decisions / approval” as the primary stays-in-tenant story unless those objects actually exist in the Security tenant DB. Hub Security summary already says “review evidence, tenant scope, audit trail, and AI provider processing” — align the body. Architecture article keeps review-package data flow.

## Why

`data-handling-tenant-isolation-help-guide-content.ts`: subtitle “How review evidence flows”; overview “data flow for architecture reviews”; leaves card “Architecture brief text and evidence context”; stays card “Findings, finalized review records, decisions, approval, and audit log entries”.

Security operators do not run architecture reviews. Inventory ZIP, Azure connector metadata, ARC-AMPE findings, and audit lineage are the honest objects. Do not over-claim.

## Context

- `archlucid-ui/src/lib/data-handling-tenant-isolation-help-guide-content.ts`
- `archlucid-ui/src/lib/contextual-help/help-topic-rows-governance.ts` — `/help/data-handling`
- `archlucid-ui/src/lib/help/help-center-catalog-security.ts`
- Trust Center / security-trust (SN-06) — do not contradict honesty about CPA/pen-test

## What to build

1. Product-line-aware subtitle, overview, leaves/stays cards, related links. Security leaves: inventory/finding context to the configured model provider as the product actually does (read current security-trust/data-handling markdown — do not invent a new processing story). Stays: findings, lineage, connector config, audit — not sealed architecture packages if those are Architecture-only.
2. Category-1 on `/help/data-handling` for Security: this guide is tenant isolation for SecureNow evidence, not a signed certificate; next = security-trust / subprocessors / DPA.
3. Vitest both lines. Do not drop leakage tests.

## Acceptance criteria

- Security article first viewport does not teach architecture-review intake as the data flow.
- Isolation/subprocessor honesty unchanged. No CPA SOC 2 implication.
- Architecture article unchanged.

## Constraints

- Do not rewrite legal DPA/subprocessor entity names.
- Stage data-handling copy + drawer + tests.
