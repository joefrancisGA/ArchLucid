> **Scope:** Sales-led Readiness Review close-out checklist. Use after first-pilot evidence exists; do not treat this as legal, pricing, or procurement attestation.

# Commercial conversion checklist

**Audience:** founders, sales engineers, pilot champions, and sponsor owners moving from a guided Readiness Review to an Evidence Pack, ARB Report, or annual Professional / Enterprise order form.

## Conversion rule

Do not ask for annual conversion from a vague demo. Ask after the buyer can point to one defensible architecture review package built from their evidence or an explicitly accepted demo workspace.

## 1. Inputs confirmed before sponsor send

| Input | Required evidence | Owner |
| --- | --- | --- |
| Buyer evidence source | Tier 1 Azure extractor ZIP, uploaded evidence, or explicit demo-workspace acceptance | Buyer + ArchLucid |
| Committed review | `runId`, manifest id, and committed timestamp in the first-pilot evidence bundle | ArchLucid |
| ROI baseline | Review-cycle hours, architect prep hours, and evidence assembly effort, or `not collected` labels | Buyer |
| Quality posture | PilotStrict sponsor-evidence disposition or documented quality-gate caveat | ArchLucid |
| Proof package | `go-no-go-summary.md`, `first-value-report.md`, `pilot-observability-summary.md`, and sponsor proof ZIP | ArchLucid |
| Procurement posture | `python scripts/build_procurement_pack.py --deal-ready` output or explicit note that SOC 2 CPA / third-party pen test are deferred | ArchLucid |
| Enterprise boundary posture | `python scripts/ci/assert_route_tier_policy_nav.py` passes after any route, tier, policy, or nav change | ArchLucid |
| Deployment readiness | Minimal Azure pilot checklist and data-consistency readiness are captured when this is a hosted pilot | ArchLucid |

## 2. Sponsor close-out sequence

1. Send the sponsor proof pack and first-value report.
2. Review ROI baseline labels first; do not lead with projected dollars if baselines are defaulted or demo-derived.
3. Walk through the top finding evidence chain and PilotStrict disposition.
4. Ask the sponsor to choose one next step:
   - **Evidence Pack** when procurement needs a formal artifact set.
   - **ARB Report** when the architecture review board needs a polished narrative.
   - **Annual Professional / Enterprise order form** when the pilot already met the scorecard target.
5. Record buyer blockers as evidence gaps, not sales objections.

## 3. Send / hold criteria

| Status | Criteria | Action |
| --- | --- | --- |
| Send | Buyer evidence or accepted demo is clear; quality gate is passing or caveated; ROI basis is labeled; sponsor package exists | Send sponsor packet and ask for the selected next step |
| Hold | Missing `runId`, unresolved PilotStrict signals, absent proof ZIP, unlabeled ROI defaults, stale procurement pack, or failed route/tier/policy/nav guard | Re-run the relevant proof, procurement, or drift guard before sponsor send |
| Defer | Buyer requires SOC 2 CPA attestation, public reference customer, marketplace checkout, MCP, or V1.1 connectors before purchase | Mark as deferred scope; do not imply those items are V1 prerequisites |

## 4. Annual conversion handoff

Use [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) only after the sponsor has accepted the evidence packet and the commercial tier is clear. The $15,000 guided pilot credit remains governed by [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md); this checklist does not change pricing.

## 5. Enterprise operations preflight

Run these before a security/procurement reviewer receives the close-out packet:

```powershell
python scripts/build_procurement_pack.py --deal-ready
python scripts/ci/assert_route_tier_policy_nav.py
./scripts/collect-data-consistency-readiness.ps1 -BaseUrl https://your-api.example
```

For hosted Azure pilots, also follow [`../runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md`](../runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md). These checks are evidence collection and drift detection; they do not create SOC 2 CPA attestation, third-party pen-test publication, or marketplace availability.

## Related

- [`QUOTE_TO_PILOT_PACK.md`](QUOTE_TO_PILOT_PACK.md)
- [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md)
- [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`../runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md`](../runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md)
- [`PROCUREMENT_EVIDENCE_PACKET.md`](PROCUREMENT_EVIDENCE_PACKET.md)
