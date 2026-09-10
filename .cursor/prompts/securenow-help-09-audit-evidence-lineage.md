# SH-09 — Audit evidence lineage `/governance/audit-evidence`

**Do not** confuse this with `/governance/audit` (audit trail activity log) or `/help/audit-trail`. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Dedicated Category-1 and Learn more for `/governance/audit-evidence` (and nested control-chain URLs). Copy matches the live lookup: paste assessment / snapshot / control IDs or a lineage URL, open chain of custody, start from inventory resource hubs. Claim discipline on the page already says this is not audit trail, sealed reviews, or official assurance — help must not contradict that.

## Why

Prefix steal: Approval drawer + `governance-approval` Learn more.

Live copy (`audit-evidence-page-copy.ts`): “Open the deterministic chain of custody for an audit control. Enter IDs from an assessment snapshot export or API integration — not an AI summary.” Nested page: “Control chain of custody”. SecureNow compliance dest: “Open deterministic audit control evidence chains, including ARC-AMPE export packages.”

## Context

- `archlucid-ui/src/lib/audit-evidence-page-copy.ts`
- `archlucid-ui/src/lib/audit-evidence-lineage-route.ts`
- Live clients under `archlucid-ui/src/app/(operator)/governance/audit-evidence/`
- `archlucid-ui/src/lib/product-line/securenow-compliance-home-copy.ts`
- `archlucid-ui/src/lib/contextual-help/governance-approval-rows.ts`
- Existing `/help/audit-trail` is a **different job** (workspace activity). Do not retarget Learn more there unless you add an honest section that this lookup is not.

## What to build

1. Row prefix `/governance/audit-evidence`. what = control lineage lookup; next = paste IDs or URL, or start from resource explorer; empty = lookup form is always there; results appear after valid IDs; configure = need an assessment snapshot (inventory / extract-upload / connector). Actions: resource explorer, policy packs — not approval-queue.
2. Parameterized nested control URLs: either the same prefix `startsWith` or a matcher like other parameterized help. Nested page job is the lineage spine for one control — slightly tighter whatIsThisPage is OK if you add a longer matcher; do not fall back to Approval.
3. Learn more: new slug `audit-evidence-lineage` (preferred) or omit. Do **not** use `audit-trail` or `governance-approval` as the primary article unless that article’s primary job is this lookup (it is not).
4. Vitest: `/governance/audit-evidence` and a nested controls path do not resolve Approval copy.

## Acceptance criteria

- F1 teaches ID/URL lookup and inventory start path.
- Help does not call this the audit activity trail or a sealed review record.
- Architecture Approval help unchanged.

## Constraints

- Reuse page copy strings. Do not invent AI-generated lineage.
- Stage lineage row + topic map (+ optional article) + tests.
