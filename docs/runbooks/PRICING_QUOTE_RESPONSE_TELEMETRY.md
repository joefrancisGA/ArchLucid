> **Scope:** Owner-facing operational telemetry for marketing **pricing quote** follow-up velocity — time-to-first-response and time-to-close — without CRM integration.

# Pricing quote response telemetry

## What is measured

System of record: **`dbo.MarketingPricingQuoteRequests`** (migration 106 + follow-up columns from migration 230).

| Interval | Start | End | Notes |
|----------|-------|-----|-------|
| **Time to first response** | `CreatedUtc` | `FirstResponseUtc` | Pending rows use `CreatedUtc` → report `as-of` time |
| **Time to close** | `CreatedUtc` | `ClosedUtc` | Open rows use `CreatedUtc` → report `as-of` time |

Acknowledge and close mutations are recorded by:

- `POST /v1/admin/marketing/pricing-quote-requests/{id}/acknowledge` → sets `FirstResponseUtc`
- `POST /v1/admin/marketing/pricing-quote-requests/{id}/close` → sets `Status = Closed`, `ClosedUtc`

Day-to-day triage for **open, unanswered** rows remains on **`/admin/pricing-quote-aging`** and [`MARKETING_PRICING_QUOTE_NOTIFICATIONS.md`](MARKETING_PRICING_QUOTE_NOTIFICATIONS.md).

## Thresholds

### First human acknowledgement

| Status | Condition (hours since `CreatedUtc`) | Owner action |
|--------|--------------------------------------|--------------|
| **ok** | &lt; 18 | No action |
| **warn** | 18 – 23.99 | Assign owner; send first human reply same business day |
| **breach** | ≥ 24 | Page sales leadership; acknowledge via admin API after human contact |
| **pending** | `FirstResponseUtc` is null | Treat as live aging; use pricing-quote-aging dashboard |

Targets align with [`MARKETING_PRICING_QUOTE_NOTIFICATIONS.md`](MARKETING_PRICING_QUOTE_NOTIFICATIONS.md): first human acknowledgement within **1 business day (24h UTC)**.

### Close / follow-up closure

| Status | Condition (hours since `CreatedUtc`) | Owner action |
|--------|--------------------------------------|--------------|
| **ok** | closed and &lt; 72 | None — within 3-business-day quote-delivery target |
| **behind_target** | closed and 72 – 119.99 | Log in weekly review; tighten handoff to proof packet |
| **warn** | closed and 120 – 167.99, **or** still open at 120h | Schedule proof-readiness review; confirm next commercial action |
| **breach** | closed and ≥ 168, **or** still open at 168h | Sponsor review of stalled deal; close or re-open with logged reason |
| **pending** | `ClosedUtc` is null | Include in weekly open-follow-up list |

Close breach at **168h (7 days)** matches the quote-to-proof follow-up SLA in [`QUOTE_TO_PROOF_PACKET.md`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-checklist).

## Weekly summary generation

No manual SQL is required. Generate JSON + Markdown for the **previous calendar week** (Monday 00:00 UTC → next Monday 00:00 UTC, exclusive end):

```powershell
.\scripts\Invoke-PricingQuoteResponseWeekly.ps1
```

Or invoke the Python script directly with an explicit window:

```powershell
python scripts/ci/report_pricing_quote_response_weekly.py `
  --input-json fixtures/pricing-quote-response/sample-quote-requests.json `
  --week-start 2026-06-09T00:00:00+00:00 `
  --week-end 2026-06-16T00:00:00+00:00 `
  --as-of 2026-06-16T12:00:00+00:00 `
  --json-out artifacts/pricing-quote-response/weekly-summary.json `
  --markdown-out artifacts/pricing-quote-response/weekly-summary.md
```

Scheduled workflow: `.github/workflows/pricing-quote-response-weekly.yml` (Mondays 07:00 UTC, `workflow_dispatch`).

### Production / staging (SQL)

Set a read-only ODBC connection string (never commit secrets):

```powershell
$env:ARCHLUCID_PRICING_QUOTE_TELEMETRY_SQL = '<odbc-connection-string>'
python scripts/ci/report_pricing_quote_response_weekly.py `
  --json-out artifacts/pricing-quote-response/weekly-summary.json `
  --markdown-out artifacts/pricing-quote-response/weekly-summary.md
```

Optional: add `--strict` to exit non-zero when `weeklyDisposition` is **HOLD** (any first-response or close breach in the window).

### Weekly disposition

| Disposition | Meaning |
|-------------|---------|
| **PASS** | No warn/breach rows in the window |
| **WARN** | Warn-level aging, behind-target closes, or open follow-ups still pending |
| **HOLD** | At least one first-response or close **breach** |

## Escalation playbook

1. **Monday owner review (15 min):** Open `weekly-summary.md`; sort request detail by `firstResponseSlaStatus` / `closeSlaStatus` breach first.
2. **First-response breach:** Acknowledge in admin UI, assign `AssignedOwner`, document outreach in commercial notes (no row deletion).
3. **Close breach / 7-day open:** Decide: send proof packet, defer scope, or close lost — use `POST .../close` only after the decision is logged.
4. **Repeat breaches two weeks running:** Review inbox routing and owner capacity (still no CRM required for V1).

## Related

- Inbox + real-time aging: [`MARKETING_PRICING_QUOTE_NOTIFICATIONS.md`](MARKETING_PRICING_QUOTE_NOTIFICATIONS.md)
- Proof handoff checklist: [`QUOTE_TO_PROOF_PACKET.md`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-checklist)
- Grafana sales-ops row: [`OBSERVABILITY.md`](../library/OBSERVABILITY.md)
