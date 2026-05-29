# Route / tier / policy / nav drift gate (V1)

**Audience:** Release engineers and sponsor-handoff operators.

**Last reviewed:** 2026-05-28

## When the guard is required

Run the drift gate before **sponsor handoff** or **production-like hosted pilot** proof when any of these surfaces changed since `origin/main` (or your release base ref):

- API route policies and controllers under `ArchLucid.Api/Controllers/`
- Operator navigation and route-tier modules under `archlucid-ui/src/lib/operator-nav` and `archlucid-ui/src/lib/route-tier`
- Registry JSON under `scripts/ci/data/route_tier_policy_nav_*.json`
- `docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md` and `docs/library/PRODUCT_PACKAGING.md`

`scripts/collect-first-pilot-proof.ps1` always emits `route-tier-policy-nav-parity.md` / `.json`. When git detects surface changes, sponsor handoff treats parity failures as **BLOCK** even in readiness-only mode.

## Commands

```powershell
python scripts/ci/assert_route_tier_policy_nav.py --sync
python scripts/ci/detect_route_tier_policy_nav_changes.py --base-ref origin/main
```

Proof collection (with committed review):

```powershell
./scripts/collect-first-pilot-proof.ps1 -BaseUrl https://your-api.example -RunId <runId> -SponsorHandoff
```

## Remediation

1. Run `assert_route_tier_policy_nav.py --sync` and commit registry updates.
2. Re-run proof; confirm `route-tier-policy-nav-parity` is **PASS**.
3. If still failing, open the parity Markdown report for the first mismatched route or nav label.

Canonical matrix: [ROUTE_TIER_POLICY_NAV_MATRIX.md](ROUTE_TIER_POLICY_NAV_MATRIX.md).
