# Executive review packet

**Generated (UTC):** 2026-05-16 14:00:00 Z

## Manifest summary

- **System:** Claims Intake Modernization
- **Manifest version:** claims-intake-v3-demo
- **Run:** `claims-intake-modernization`
- **Status:** Committed

## Top decisions

- **PHI ingress classification** — Enforce boundary classifier before persistence
  - Confidence: Rule audit (0.92)
  - Evidence: /governance/decision-register

## Run summary

# Executive run summary — Claims Intake Modernization

**Run:** `claims-intake-modernization`

## Findings by severity

| Severity | Count |
|----------|------:|
| Critical | 1 |
| High | 1 |
| Medium | 1 |
| Low | 0 |

## Executive summary

Proceed with claims intake modernization under monitored PHI minimization controls &#8212; sponsor-facing KPIs remain on track.

## Top findings

- PHI minimization risk at intake boundary
- Under-provisioned OCR worker autoscale floor
- Missing regional failover documentation

## Portfolio signals (live)

- **Findings resolved (30d):** 2
- **Findings discovered (30d):** 3
- **Stale architecture risks:** 1
- **Waivers expiring (14d):** 0

### Next actions
- Review stale PHI minimization risk in the architecture risk register.
- Confirm EA-adjusted savings assumptions with FinOps before sponsor sign-off.

## ROI basis

**Savings pricing basis:** EA-adjusted
**EA discount multiplier:** 0.85
**Pricing basis note:** Cost-category findings use EA-adjusted Azure Retail rates for the demo tenant.
**Cost evidence freshness:** Fresh (stale after 90 days)
**Estimated savings (USD):** 8,400.00

## Sponsor artifact evidence badges

- **Evidence source:** **Azure Retail catalog** (`azure-retail`)
- **Evidence freshness:** **Fresh** (`fresh`)

## ROI basis by disposition

**Cost basis:** estimated (not invoiced Azure cost)
- **Open (estimated potential):** 6,200.00 USD
- **Needs evidence:** 1,000.00 USD
- **Accepted risk:** 1,200.00 USD
- **Deferred:** 0.00 USD
- **Waived:** 0.00 USD
- **Realized (remediated):** 0.00 USD
- **Rejected (not applicable):** 0.00 USD

## Realized value (computed)

- **Findings remediated (30d):** 1
- **Median time to remediation (days):** 4.5
- **Active waivers:** 0
- **Waivers retired (30d):** 0
- **Waiver expiry reversions (30d):** 0
