# EX-COST-01 — Collect cost only when the user asks

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement EX-SI-01 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Azure extractor. **Depends on:** current `master`. `Get-SecureNowAzurePackage.ps1` already treats `-IncludeCost` and `-IncludeRetailPrices` as opt-in. This session changes the quick start that turns them on.

## Goal

`Run-SecureNowAzureExtractor.ps1` and `Run-ArchLucidAzureExtractor.ps1` collect inventory without Cost Management and without retail prices. The user passes `-IncludeCost` to query subscription ActualCost. The user passes `-IncludeRetailPrices` to call the public retail-price API. App-setting host collection stays on.

## Why

The same `Hmd_HI_HAP_Non_Prod` run printed `Cost summary: enabled (timeout: 180 seconds)`, spent about three minutes in ActualCostSummary, then logged HTTP 429 `Too many requests` and continued with cost skipped. RetailPrices still ran because the quick start sets `IncludeRetailPrices = $true`.

`Run-SecureNowAzureExtractor.ps1` sets `IncludeCost = (-not $SkipCost)`, so cost is on unless the user remembers `-SkipCost`. `Run-ArchLucidAzureExtractor.ps1` sets `IncludeCost = $true` and `IncludeRetailPrices = $true` with no switch. The package scripts underneath already omit both unless the switch is present. The quick start is the default the owner runs.

## Read first

- `scripts/azure/Run-SecureNowAzureExtractor.ps1`
- `scripts/azure/Run-ArchLucidAzureExtractor.ps1`
- `scripts/azure/Get-SecureNowAzurePackage.ps1` (`-IncludeCost`, `-IncludeRetailPrices`, the "Cost summary" host text)
- `scripts/azure/Get-ArchLucidAzurePackage.ps1`
- `scripts/azure/tests/Run-SecureNowAzureExtractor.Tests.ps1`
- `scripts/azure/tests/Run-ArchLucidAzureExtractor.Tests.ps1`
- `scripts/azure/Invoke-ArchLucidScheduledAzureExtractor.ps1` (already forwards the switches only when the caller sets them)

## What to build

1. Branch `extractor/cost-01-opt-in-cost` from current `master`.
2. On both quick starts, add `[switch] $IncludeCost` and `[switch] $IncludeRetailPrices`, defaulting to off. Pass them through to the package script only when the user set them.
3. Remove the default-on assignment. A command with only `-SubscriptionId` must not enter ActualCostSummary and must not write `retail-prices.json`.
4. Keep `-SkipCost` on the SecureNow quick start as a switch that forces cost off, including when `-IncludeCost` is also present. Update its comment so the way to collect cost is `-IncludeCost`. The banner says `Cost summary: off` unless `-IncludeCost` is set and `-SkipCost` is not. When cost is on, keep the timeout text.
5. `-CostTimeoutSeconds` still bounds the ActualCost query when cost is on. It does not turn cost on by itself.
6. Leave `-IncludeAppSettingsHosts` enabled on the quick starts.
7. Leave the scheduled extractor opt-in. It must not gain a new default that turns cost on.
8. Tests:
    - The SecureNow quick-start source passes `IncludeCost` only from `$IncludeCost`, not from `(-not $SkipCost)`.
    - The SecureNow quick-start source passes `IncludeRetailPrices` from `$IncludeRetailPrices`, not from `$true`.
    - The ArchLucid quick-start source does not assign `IncludeCost = $true` or `IncludeRetailPrices = $true`.
    - App settings remain `IncludeAppSettingsHosts = $true` on both quick starts.
    - The SecureNow banner text still has a cost-summary line. The skipped line is the default wording in the script.

## Acceptance criteria

- A quick start without cost flags does not call Cost Management and does not call the retail-price API.
- `-IncludeCost` turns on ActualCost only.
- `-IncludeRetailPrices` turns on retail prices only.
- `-SkipCost` keeps ActualCost off.
- App-setting collection is unchanged.
- Scheduled collection stays opt-in.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not change the SecurityInventory catch or companion file writes. That is EX-SI-01.
- Do not change the Cost Management query body, the 429 retry, or the retail-price URL.
- Working-tree safety. Stage only the two quick starts, their comments, and their tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
pwsh -NoProfile -Command "Invoke-Pester -Path 'scripts/azure/tests/Run-SecureNowAzureExtractor.Tests.ps1','scripts/azure/tests/Run-ArchLucidAzureExtractor.Tests.ps1' -Output Normal"
```

Heartbeat every 8 seconds on any command expected to run longer than 15 seconds.

## Done when

Tests pass. Tell the owner the next `Run-SecureNowAzureExtractor.ps1 -SubscriptionId ...` command should print `Cost summary: off` and should not print `ActualCostSummary`. Cost comes back only with `-IncludeCost`. Wait for that run before any commit.
