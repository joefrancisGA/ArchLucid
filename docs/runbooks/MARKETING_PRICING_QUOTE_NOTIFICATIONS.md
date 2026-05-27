> **Scope:** Operations for sales inbox mail when a visitor submits the marketing **pricing quote** form (`POST /v1/marketing/pricing/quote-request` → `dbo.MarketingPricingQuoteRequests`).

# Marketing pricing quote → sales notification

## Behaviour

- After a **successful persist** (SQL path), the API sends a **transactional email** to the configured inbox with request id, timestamp (UTC), and **non-secret** fields from the submission. Message body HTML-encodes free text. **Secrets must not** appear in email.
- **Provider `Noop`:** no SMTP or ACS send; the notifier logs at **Information** that it **would** notify sales (same pattern as other outbound mail when mail is not wired).

## Configuration (`Email` section)

| Key | Purpose |
|-----|---------|
| `Email:Provider` | `Noop` (default, dev-safe), `Smtp`, or `AzureCommunicationServices`. |
| `Email:PricingQuoteSalesInbox` | Recipient for quote-request notifications (default **`sales@archlucid.net`**). |
| `Email:FromAddress` / `Email:FromDisplayName` | Envelope from when provider sends real mail. |
| Smtp or ACS sub-keys | See `EmailNotificationOptions` and hosted secrets / Key Vault layout for your environment. |

**Staging / production:** Set provider + credentials so mail reaches **`sales@archlucid.net`** (or override inbox via config). **Tenant safety:** handler stays scoped to the anonymous marketing endpoint; rate limits for the route are unchanged.

## Verification

- Submit a quote from the marketing UI or call the API; confirm a row in **`dbo.MarketingPricingQuoteRequests`** and an inbox message (or `Noop` **would notify** line in logs).
- Idempotency key on the message: `marketing-pricing-quote:{request-id}`.
- **Operator dashboard (Improvement #6):** Admin → **Pricing quote aging** (`/admin/pricing-quote-aging`) lists open rows from **`GET /v1/admin/marketing/pricing-quote-aging`** with warn/breach highlighting — no SQL or curl required for day-to-day triage.
- **Grafana (Improvement #6):** **`infra/grafana/dashboard-archlucid-authority.json`** — **Sales ops** row:
  - Panel **pricing-quote-open-warn** — stat: `sum(archlucid_pricing_quote_request_age_hours_count{breach_status="warn at 18h"})` or API-derived equivalent
  - Panel **pricing-quote-open-breach** — stat: `sum(archlucid_pricing_quote_request_age_hours_count{breach_status="breach at 24h"})`
  - Panel **pricing-quote-age-hours** — timeseries: `histogram_quantile(0.95, sum(rate(archlucid_pricing_quote_request_age_hours_bucket[5m])) by (le, breach_status))`
- **Alert routing:** **`ArchLucidPricingQuoteAcknowledgementBreach`** in **`infra/prometheus/archlucid-alerts.yml`** must route to the same P0/P1 action group as other sales-critical alerts (see archived #46 / `prometheus_p0_rules.tf`).
- **Staging synthetic breach:** Insert or backdate a row **>24h** (see **`MarketingPricingQuoteAgingAdminControllerIntegrationTests`**) and confirm:
  1. Operator dashboard shows **breach at 24h**
  2. Prometheus histogram records `breach at 24h` within one metrics refresh cycle (**5m**)
  3. **`ArchLucidPricingQuoteAcknowledgementBreach`** fires in staging Alertmanager

## Related

- Product / pricing context: [`docs/go-to-market/PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md)
- Open product questions: [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) (item 13 — public price list vs quote-on-request)

## Sales acknowledgement SLA

Committed response targets for **human** sales follow-up on rows in **`dbo.MarketingPricingQuoteRequests`** (no buyer-facing auto-reply):

| Milestone | Target |
|-----------|--------|
| **First human acknowledgement** | Within **1 business day** (**24 hours** on weekdays, UTC) |
| **Full quote delivered** | Within **3 business days** (UTC weekdays) |

Operational hygiene (not a product change):

1. **`dbo.MarketingPricingQuoteRequestsAging`** — SQL view with `CreatedUtc`, `AgeHours`, and derived `BreachStatus`:
   - `ok` — under 18 hours
   - `warn at 18h` — 18–23 hours unanswered
   - `breach at 24h` — 24+ hours unanswered
2. **Operator API:** `GET /v1/admin/marketing/pricing-quote-aging` (AdminAuthority) returns open, unanswered rows with age and breach status. Follow-up mutations:
   - `POST /v1/admin/marketing/pricing-quote-requests/{id}/acknowledge` — sets `FirstResponseUtc` (and optional `AssignedOwner`); removes the row from aging.
   - `POST /v1/admin/marketing/pricing-quote-requests/{id}/close` — sets `Status = Closed`; removes the row from aging.
3. **Columns (migration 230):** `Status` (`Open` / `Closed`), `FirstResponseUtc`, `AssignedOwner`, `ClosedUtc` on `dbo.MarketingPricingQuoteRequests`.
4. **Metrics:** `MarketingPricingQuoteAgingMetricsHostedService` snapshots the view every **5 minutes** and records **`archlucid_pricing_quote_request_age_hours`** (histogram, label `breach_status`).
5. **Alert:** **`ArchLucidPricingQuoteAcknowledgementBreach`** in **`infra/prometheus/archlucid-alerts.yml`** fires when any row exceeds **24 hours** unanswered.

**Escalation:** On `warn at 18h`, assign or ping the pricing-quote owner; on `breach at 24h`, page sales leadership and clear or backdate only after a logged human response (do not delete rows for SLA gaming).
