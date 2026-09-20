# AX-DC-08 — Hosted vs Tier 1 honesty callouts

**Wave:** AX-DC. **Depends on:** AX-DC-04. **Do not** add collectors or enable hosted POST.

Follow [`.cursor/prompts/azure-extractor-diagram-consumption-00-index.md`](azure-extractor-diagram-consumption-00-index.md) global constraints.

## Goal

Make **hosted GET-only** vs **Tier 1 PowerShell** collector differences visible where operators infer hostname coupling:

- Hosted: `app-settings-not-collected-hosted-get-only` — no `hostnameInferredTarget` from app settings
- Tier 1: optional `-IncludeAppSettingsHosts` — redacted hostnames only; never values

## Why

AX-DE-18 shipped Tier 1 collection and hosted warning code. Without UI copy, operators assume the diagram is complete and misread missing **Likely connected to** edges as “no dependency.”

## Context

- `AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsNotCollectedHostedGetOnly`
- `Get-ArchLucidAzurePackage.ps1` `-IncludeAppSettingsHosts`
- [`docs/library/AZURE_EXTRACTOR.md`](../../docs/library/AZURE_EXTRACTOR.md) — Tier 1 vs Tier 2
- [`docs/library/customer-facing/CLOUD_CONNECTIONS.md`](../../docs/library/customer-facing/CLOUD_CONNECTIONS.md)
- AX-DC-04 banner — extend with contextual callouts, do not duplicate noise

## What to build

1. Map warning code `app-settings-not-collected-hosted-get-only` to workbench callout:
   - Title: “App setting hostnames not collected on hosted pull”
   - Body: link to extractor README / trust-center anchor for Tier 1 `-IncludeAppSettingsHosts`
   - CTA: “Re-run Tier 1 package with -IncludeAppSettingsHosts” (text + doc link — no auto-download)
2. When package manifest indicates Tier 1 app-settings companion present, show subtle positive line: “App setting hostnames included (values not collected).”
3. Diagram legend footnote (one line): “Likely connected to edges require Tier 1 app settings collection or other ARM sources.”
4. Align `AZURE_EXTRACTOR.md` and discovery doc cross-links if still stale (docs-only lines OK in this prompt).
5. Tests:
   - Vitest: warning → callout rendered
   - Vitest: without warning → no Tier 1 upsell banner
   - Hosted zip builder test already asserts warning code — do not weaken

## Acceptance criteria

- No implication that hosted Reader pull collects app settings.
- No display of setting values. Hostnames only when companion exists.

## Constraints

- `cd archlucid-ui && npx vitest run src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx`
- `dotnet test ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj --filter 'FullyQualifiedName~AppSettings'`
- Heartbeat if >15s.

## Done when

Workbench explicitly explains missing hostname-inferred edges on hosted snapshots.
