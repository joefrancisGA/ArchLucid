# AX-DC-07 — Golden fixture + Playwright: Executive **May access**

**Wave:** AX-DC. **Depends on:** AX-DC-02; AX-DC-03 preferred. **Do not** add collectors.

Follow [`.cursor/prompts/azure-extractor-diagram-consumption-00-index.md`](azure-extractor-diagram-consumption-00-index.md) global constraints.

## Goal

Lock the regression: **Executive** mode diagram from a golden Azure extractor ZIP shows a **May access** edge from Web App to SQL Database when system-assigned identity + `SQL DB Contributor` (or equivalent data-plane role) are in the package — canvas or outline must expose the edge label.

## Why

Unit tests in ArtifactSynthesis can pass while the workbench route, API mode string, or forest renderer regresses. This is the buyer-visible proof that AX-DE collection + AX-DC consumption work end-to-end.

## Context

- Existing golden ZIP patterns in `ArchLucid.Application.Tests` / `archlucid-ui/e2e/`
- `archlucid-ui/e2e/azure-extractor-upload.spec.ts` — upload flow
- `DiagramsWorkbenchClient.tsx` — mode = Executive
- AX-DC-02 includer — required for canvas nodes

## What to build

1. Add minimal golden ZIP (or reuse/extend existing test package) under test assets:
   - `Microsoft.Web/sites` with `identity.principalId`
   - `Microsoft.Sql/servers/databases` target
   - `role-assignments.json` row matching principal → database scope
   - No ADF companions required
2. Application integration test: upload → materialize → compile Executive `DiagramAst` → assert edge label contains **May access** (or humanizer equivalent) and both endpoints present.
3. Playwright spec `archlucid-ui/e2e/infra-evidence-executive-may-access.spec.ts` (or extend azure-extractor spec):
   - Mock or seed snapshot with golden package id
   - Open Diagrams workbench, select Executive
   - Assert outline or accessible text includes **May access**
4. If AX-DC-03 landed: optional assert dashed/dotted class on edge in DOM (data-testid on forest edge stroke metadata — only if already exposed; do not block on SVG internals if flaky).

## Acceptance criteria

- CI fails if Executive drops app→SQL authorization after future refactors.
- Test does not require live Azure. No secrets in ZIP.

## Constraints

- `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~MayAccess|Executive'`
- `cd archlucid-ui && npx playwright test e2e/infra-evidence-executive-may-access.spec.ts` (or named file)
- Heartbeat if >15s.

## Done when

Playwright + unit test green on branch; documents golden package path in test comment.
