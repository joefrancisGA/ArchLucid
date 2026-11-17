> **Scope:** Contributor-reference — Internal Azure inventory-host saturation and reseed guidance; not customer-facing assurance.

# Inventory host / reachability — saturated /al-bug reseed classes

Owner pivot **2026-10-29:** `archlucid-core` dry hunts **#882–#894** closed five `(candidate)` rows per run using **arithmetic sibling** inputs (`.e(N+1)` Cosmos typo suffixes, `[N,"a"]` firewall arrays, supplementary-plane `U+XXFFFE`, `%22` depth **N+1**, Latin Extended **U+1ECx** storage names). Those mechanisms were already pinned; further siblings are **not hunt-ready**.

## Saturated classes (do not reseed or add per-integer tests)

| Class tag | Mechanism already pinned | Cheap-disproof without new test |
| --- | --- | --- |
| `[class:cosmos-typo-en-suffix]` | Unsupported `.documents.azure.eN` typo suffixes | `(invalid)` — cite `AzureInventoryAppSettingHostPinnedMechanismTheoryTests` or earliest `ParseSettingValues_e*_regional_cosmos_*` regression |
| `[class:storage-latin-extended-i]` | Non-ASCII `AccountName` fails `^[a-z0-9]{3,24}$` | `(invalid)` — cite pinned theory or `ParseSettingValues_u1EC4_*` family |
| `[class:keyvault-supplementary-fffe]` | Secret segment preserves supplementary noncharacters | `(valid-no-repro)` — cite pinned theory or first `u*FFFE` regression |
| `[class:route-percent-decode-depth]` | `PercentDecodeUntilStable` eight-pass cap | `(valid-no-repro)` — cite pinned theory or layer ≥ 9 regression |
| `[class:firewall-heterogeneous-array-index]` | `[N,"a"]` rule collection arrays require edge-control evidence | `(valid-no-repro)` — cite pinned theory or first `[104,"a"]` regression |

## Reseed instead (reachability required)

When `archlucid-core` reopens from `cooling`, seed from **workflow 1.1a** signal: sibling-path disagreement, **recent `ArchLucid.Core/` churn** without tests, analyzer SARIF, surviving mutants, flake log — not the five classes above.

## CI

New per-integer test **method names** matching ladder patterns are blocked unless listed in `scripts/ci/al-bug-inventory-host-ladder-test-allowlist.txt` (grandfather list). Extend **`AzureInventoryAppSettingHostPinnedMechanismTheoryTests.cs`** for new pins.

## Zone status

`archlucid-core` is **`cooling`** until a hunt-ready row with reachability is promoted or production commits on `ArchLucid.Core/` reopen high-yield hunting.
