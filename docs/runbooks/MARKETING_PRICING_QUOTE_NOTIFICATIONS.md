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
2. **Operator API:** `GET /v1/admin/marketing/pricing-quote-aging` (AdminAuthority) returns the aging view for sales ops.
3. **Metrics:** `MarketingPricingQuoteAgingMetricsHostedService` snapshots the view every **5 minutes** and records **`archlucid_pricing_quote_request_age_hours`** (histogram, label `breach_status`).
4. **Alert:** **`ArchLucidPricingQuoteAcknowledgementBreach`** in **`infra/prometheus/archlucid-alerts.yml`** fires when any row exceeds **24 hours** unanswered.

**Escalation:** On `warn at 18h`, assign or ping the pricing-quote owner; on `breach at 24h`, page sales leadership and clear or backdate only after a logged human response (do not delete rows for SLA gaming).
