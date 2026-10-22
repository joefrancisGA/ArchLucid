# SN-RT-10 — Confirm inferred connections (Option D)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option D.** **Depends on:** SN-RT-09 proposed-edge DTO. Prefer SN-RT-03 so inventory ARM ids can be suggested.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Show proposed connections from **uploaded** config (SN-RT-09) and let the operator **confirm or dismiss**. Confirmed rows become `ProvenanceKind.HumanAssertion` and paint on Data Flow with label **Confirmed connection** (sentence case, locked). Dismissed rows never paint.

Inventory `{0}` templates and unresolved hosts without an upload are **Option E** (**SN-RT-12/13**). This prompt may persist a `source` field (`upload`) so E can reuse the same API later.

## Why

Silent inference on uploaded files would mix operator intent with hostname guesses. `{0}` tenant templates without an upload are the questionnaire (**SN-RT-12**), not this table.

## Context

- `ProvenanceKind.HumanAssertion`
- Diagram reconcile workbench (`/governance/infrastructure/diagram-reconcile`) — **reuse chrome if it fits**; do not invent a second product. A dedicated panel on inventory **Diagrams** is OK if reconcile is the wrong job (reconcile is diagram↔inventory, not env-edge confirm). Prefer a panel on **Diagrams** workbench.
- IDP declared-edge dash language (`declared` label) — HumanAssertion may reuse dash + `declared` without teal.

## What to build

1. API: list proposed edges for a snapshot/run; POST confirm/dismiss (ids). Persist with TenantId. Mutating route: audit + OpenAPI snapshot + route-tier sync.
2. UI: table of from → to (host/catalog), setting name, source (`upload`), status (proposed / confirmed / dismissed). Primary confirm disabled until a row is selected. Sentence case. Visible-boundary buttons. Do **not** generate questionnaire items here (**SN-RT-12**).
3. Confirmed → graph edge HumanAssertion, association type e.g. `operatorConfirmedConnection`, SN-PE catalog family **AuthorizedAccess** or a new `HumanConfirmed` family — **pick HumanConfirmed** so it is not mistaken for RBAC. Label **Confirmed connection**. IncludeOnDataFlow true.
4. Unresolved to-host: operator may pick an inventoried node (dropdown of SQL/storage/KV/apps) or name an external node (SN-DF-01 style). No free-text ARM id injection without matching inventory or external-node helper.
5. Tests: confirm persists HumanAssertion; dismiss omitted from compile; unauthenticated/wrong tenant 403; Vitest for disable-until-select.

## Acceptance criteria

Operator can confirm UI→API and API→`archlucidtenantedev` without Azure logs. Unconfirmed proposals do not appear on Data Flow. Honesty caption when any HumanConfirmed edge exists.

## Constraints

- Working-tree check. UI: no ghost/link buttons; no desktop tab collapse.
- Do **not** auto-confirm. Do **not** call Azure at confirm time. Do **not** implement the inference questionnaire (**SN-RT-12/13**).
- Stage only this prompt’s paths. **No `git add -A`.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Form validation: disable confirm until a selection exists (`UI-Form-Validation-Affordances`).

## Verification

```bash
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter 'FullyQualifiedName~ConfirmedConnection|FullyQualifiedName~OperatorConfirmed'
# from archlucid-ui after touching UI:
# npm test -- --run <matching vitest>
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api/ArchLucid.Api.csproj'
python3 scripts/ci/assert_route_tier_policy_nav.py --sync
```

Heartbeat every 8s if >15s. Do not `npm ci` unless UI tests cannot run otherwise.

## Done when

Confirm/dismiss API + compile tests exist. Unconfirmed proposals stay off the canvas.
