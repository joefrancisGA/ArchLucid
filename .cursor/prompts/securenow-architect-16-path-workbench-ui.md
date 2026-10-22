# SA-16 — Path inspect workbench (SecureNow)

**Do not** make the graph explorer the home. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

In the **Security** product line, keep the findings / assigned-to-me / remediation-factory queues as the desk. Add a path inspect panel (finding detail or factory drawer) that renders SA-04 hops, confidence **band**, weakest hop, cut point, and link to advisory instance. Architecture shell may hide or show the same panel behind Operate if the route is shared — do not teach architecture reviews.

## Why

Operators buy ranked work. The graph is substrate. Collapsing desktop review tabs is forbidden; this is not a review-workspace tab strip change.

## Context

- `archlucid-ui` remediation factory / findings clients
- `securenow-security-home-copy.ts`
- SA-04 API types — regenerate `api-types` if OpenAPI changed
- Carbon `EnterpriseTable`, sentence case, TB-2005
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Path hops table: from, to, edge, provenance, band. Weakest hop called out.
2. Empty: “No architect path cited — this finding is resource-scoped.”
3. Do not display a percentage. Do not auto-play a force-directed graph as the primary view (optional Operate disclosure later).
4. Vitest: Security copy uses SecureNow; no `first-architecture-review`; provenance labels visible.
5. Contextual help prefix if you add a dedicated route; otherwise extend factory/finding drawer help without `/governance` Approval steal (see SH-07).

## Acceptance criteria

- Keyboard and focus-visible on the panel.
- No new desktop **More** overflow for workspace tabs.

## Constraints

- No second Next.js app.
- Verification: focused Vitest; no full Playwright suite unless you already have a factory test to extend.

## Done when

An operator can open a path from a finding and see why it is Possible, without leaving the queue job.
