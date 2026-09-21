# SN-RT-13 — Inference questionnaire UI (Option E)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option E.** **Depends on:** SN-RT-12 item shape. Prefer SN-RT-10 confirm/dismiss API (reuse, do not fork persist).

Do not implement from the wave index. Implement only *What to build*.

## Goal

Walk the operator through SN-RT-12 items as **questions** (Yes / No / Skip), not a silent bulk table. Yes → `ProvenanceKind.HumanAssertion` (**Confirmed connection**, `HumanConfirmed` family — same lock as SN-RT-10). No → dismissed, never paints. Skip → stays proposed, does not paint.

## Why

Option D’s table is the right chrome for **uploaded** rows the operator already supplied. Option E asks about **gaps the extractor guessed**. A questionnaire makes that difference honest: the product is asking, not declaring.

## Context

- SN-RT-10 API: list / confirm / dismiss with TenantId, audit, OpenAPI, route-tier
- Inventory **Diagrams** workbench — add a panel or path; do **not** hide desktop review workspace tabs behind **More**
- `UI-Form-Validation-Affordances` — primary disabled until Yes/No/Skip is chosen for the current item
- TB-645: sentence case, visible-boundary `Button`

## What to build

1. Reuse SN-RT-10 persist. If 10 has not landed, implement the same DTO + routes here (one persist path, `source=questionnaire`).
2. UI: one question at a time (or a short list with the current row focused). Show from label, to host/catalog/choices, why this was asked (rule name in sentence case, e.g. “Tenant catalog template”).
3. For catalog-choice items: dropdown of inventoried user databases; confirm disabled until a database or “server only” is selected when the answer is Yes.
4. Progress copy: “Question 3 of 8”. No percent confidence.
5. Honesty caption when any HumanConfirmed edge exists (shared with SN-RT-10 if already shipped).
6. Tests: Yes persists HumanAssertion and compile includes the edge; No omitted; Skip omitted; unauthenticated/wrong tenant 403; Vitest disable-until-choice; no desktop tab overflow pattern.

## Acceptance criteria

Operator can confirm API → `archlucidtenantedev` from the questionnaire with no upload and no Log Analytics. Unanswered items stay off Data Flow. Upload confirm table (D) still works if 10 landed.

## Constraints

- Working-tree check. No ghost/link buttons. No desktop tab collapse.
- Do **not** auto-answer. Do **not** call Azure. Do **not** bulk-confirm all Yes.
- Do **not** start SN-RT-12 generation in this prompt if 12 already emits items.
- Stage only this prompt’s paths. **No `git add -A`.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```bash
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter 'FullyQualifiedName~Questionnaire|FullyQualifiedName~ConfirmedConnection'
# from archlucid-ui after touching UI:
# npm test -- --run <matching vitest>
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api/ArchLucid.Api.csproj'
python3 scripts/ci/assert_route_tier_policy_nav.py --sync
```

Heartbeat every 8s if >15s. Do not `npm ci` unless UI tests cannot run otherwise.

## Done when

Questionnaire Yes/No/Skip is tested. Skip does not paint. Shared HumanConfirmed honesty caption exists.
