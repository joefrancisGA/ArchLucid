# Sponsor review packet

**Generated (UTC):** 2026-05-16 14:00:00 Z

## Manifest summary

- **System:** Claims Intake Modernization
- **Manifest version:** claims-intake-v3-demo
- **Review ID:** `claims-intake-modernization`
- **Status:** Committed

## Execution mode

**Simulator** — **Not real-mode AI** — deterministic simulator; do not claim live model quality.

## Top decisions

- **PHI ingress classification** — Enforce boundary classifier before persistence
  - Confidence: Rule audit (0.92)
  - Evidence: Evidence link was not stored.

## Review summary

# Sponsor review summary — Claims Intake Modernization

**Review ID:** `claims-intake-modernization`

## Deterministic findings (sealed)

Findings snapshot id was not stored.

## Agent findings (advisory)


> **Simulator mode — not live AI output** This result was produced by rule-based analysis in simulator mode. Treat findings and rewrites as rehearsal only until you switch to Real mode.

### Findings by severity

| Severity | Count |
|----------|------:|
| Critical | 1 |
| Error | 1 |
| Warning | 1 |
| Info | 0 |

### Sponsor report

Proceed with claims intake modernization under monitored PHI minimization controls — sponsor-facing KPIs remain on track.

### Top findings

- PHI minimization risk at intake boundary
- Under-provisioned OCR worker autoscale floor
- Missing regional failover documentation


---

_This sponsor summary combines sealed snapshot copy (when stored), agent-stream severity counts, and sponsor report prose. Review before sharing with sponsors._

## Portfolio signals (snapshot at export)

- **Findings resolved (30d):** 2
- **Findings discovered (30d):** 3
- **Stale architecture risks:** 1
- **Waivers expiring (14d):** 0

### Next actions
- Review stale PHI minimization risk in the architecture risk register.

## ROI basis

**ROI claim disposition:** **WARN** — ROI narratives must carry estimate labels; do not lead sponsor readouts with projected dollar savings.

**Savings pricing basis:** EA-adjusted
**EA discount multiplier:** 0.85
**Pricing basis note:** Cost-category findings use EA-adjusted Azure Retail rates for the demo tenant.
**Cost evidence freshness:** Fresh (stale after 90 days)
**Estimated savings (USD):** 8,400.00 (estimate-basis — not a customer-specific savings attestation)

## Sponsor artifact evidence badges

- **Proof package:** Proof package was not loaded for this export.
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
