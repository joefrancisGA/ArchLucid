> **Scope:** Contributor-reference — inbound webhook hostile-traffic contract (TB-966); PA order for contributors and security reviewers.

# Inbound webhook hostile-traffic contract (TB-966)

> **Audience:** Contributors and security reviewers wiring or assessing **inbound** webhooks (ITSM, billing, Slack interactivity).  
> **Not** a buyer assurance claim — pipeline order alone is **not** “internet-safe.” Edge TLS/WAF does **not** replace app-layer size, verify, or replay controls.

**Buyer one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#security-reviewer-inbound-webhook-m-126) (GTM **M-126**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (GTM **M-125**).  
**Invariant:** [INV-015](ARCHITECTURE_INVARIANTS.md#inv-015-inbound-webhook-pipeline-order).

---

## PA-defensible intake order

Hostile internet traffic can exhaust CPU/memory **before** signature verification if the app allocates or parses first. Prefer:

1. **Edge** — TLS termination, optional WAF / Front Door (ops; not a substitute for app controls).
2. **Rate-limit** — ASP.NET rate limiting (or equivalent) before expensive body work.
3. **Bounded size** — reject oversized bodies using `Content-Length` and/or a hard pre-read max **before** allocating an unbounded string and **before** HMAC/JWT verify (**TB-967**).
4. **Verify (+ freshness)** — shared secret / HMAC / JWT; optional timestamp skew.
5. **Schema-parse** — JSON/form parse only after verify (+ size).
6. **Idempotent handler** — replay/event-id guard where the vendor can retry (ITSM: **TB-968** Done; billing already has `IBillingWebhookReplayGuard`).

**Still true from INV-015 / TB-012:** never parse untrusted JSON **before** authenticity verification. Rate and size must **precede** verify for DoS realism; verify must still precede parse.

---

## Surface inventory (engineering snapshot)

Legend: **Y** = present and roughly aligned · **P** = partial · **N** = missing / tracked.

| Surface | Controller | Rate | Size before allocate/HMAC | Verify before parse | Replay / idempotency | Notes |
|---------|------------|------|---------------------------|---------------------|----------------------|-------|
| ITSM Jira / ServiceNow | `ItsmInboundWebhooksController` | Y (`fixed`) | Y — `InboundWebhookBoundedBodyReader` (Content-Length + hard ceiling; 64 KiB) | Y | Y — `IItsmInboundWebhookReplayGuard` (**TB-968** Done) | 413 before verify/parse (**TB-967**); ops [`ITSM_INBOUND_WEBHOOK_REPLAY_GUARD.md`](../runbooks/ITSM_INBOUND_WEBHOOK_REPLAY_GUARD.md) |
| Stripe billing | `BillingStripeWebhookController` | Y | Y — same shared reader | Y (provider) | Y (`IBillingWebhookReplayGuard`) | **TB-967** |
| Azure Marketplace | `BillingMarketplaceWebhookController` | Y | Y — same shared reader | Y (JWT in provider) | Y (same guard family) | **TB-967** |
| Slack interactivity | `SlackInteractivityController` | Y | Y — same shared reader | Y (Slack sig) | P — vendor timestamp skew only; not billing ledger | **TB-967** |

Outbound webhook **delivery**, dry-run, and connection-management APIs are **out of scope** for this hostile-**inbound** contract.

---

## Hostile-internet checklist

Use when adding a new inbound webhook surface or reviewing an existing one:

| Control | Expectation |
|---------|-------------|
| Edge TLS / WAF | Documented for hosted SaaS; do not claim it completes app-layer hardening |
| App rate limit | Attribute or middleware on the inbound route |
| Bounded body | Reject oversize **before** unbounded allocate and before crypto — shipped via `InboundWebhookBoundedBodyReader` (**TB-967** Done) |
| Content-Type allowlist | Reject unexpected media types where vendors are fixed |
| Fail-closed secrets | Missing/empty shared secret → **401/403**, not soft accept |
| Constant-time compare | Shared-secret / HMAC compare via `WebhookSecrets.SecureEquals` (or equivalent) |
| Verify before parse | No `JsonDocument.Parse` / schema bind on unverified bodies |
| Freshness / replay | Timestamp skew (when header present) and/or event-id ledger — ITSM **TB-968** Done; billing replay guard |
| Fast ack | Prefer quick **2xx** after accept-or-reject; heavy work async when product allows |
| Error hygiene | No secret/signature material in problem details or logs |

---

## Enforcement already shipped

- `InboundWebhookPipelineOrderArchitectureTests` — ITSM source order (size check → verify → parse) + rate-limit attribute.
- `InboundWebhookPipelineOrderIntegrationTests` / `WebhookMiddlewareOrderingTests` — oversize / bad secret before parse on covered paths.
- Done **TB-012** / Wave C — INV-015 baseline (“verify before parse”).

---

## Explicit non-claims

- Pipeline order documentation ≠ internet-safe by itself.
- Signature / JWT authenticity ≠ replay, idempotency, or DoS resistance.
- Edge WAF / Front Door Network Protection ≠ complete app-layer size/verify/replay.
- ITSM inbound replay is **per API process memory** (24h window) — not cross-instance durable ledger; see [`ITSM_INBOUND_WEBHOOK_REPLAY_GUARD.md`](../runbooks/ITSM_INBOUND_WEBHOOK_REPLAY_GUARD.md).
- Billing replay does **not** imply cross-host ITSM replay parity beyond the shipped in-memory guard.

---

## Follow-on engineering

| ID | Owns |
|----|------|
| **TB-967** | **Done** — `InboundWebhookBoundedBodyReader` + 64 KiB ceiling on ITSM / Stripe / Marketplace / Slack |
| **TB-968** | **Done** — ITSM inbound replay/idempotency + optional timestamp skew ([`ITSM_INBOUND_WEBHOOK_REPLAY_GUARD.md`](../runbooks/ITSM_INBOUND_WEBHOOK_REPLAY_GUARD.md)) |

---

## Related

- [INV-015](ARCHITECTURE_INVARIANTS.md#inv-015-inbound-webhook-pipeline-order)
- Billing replay ops: [`BILLING_WEBHOOK_REPLAY_GUARD.md`](../runbooks/BILLING_WEBHOOK_REPLAY_GUARD.md)
- ITSM inbound replay ops: [`ITSM_INBOUND_WEBHOOK_REPLAY_GUARD.md`](../runbooks/ITSM_INBOUND_WEBHOOK_REPLAY_GUARD.md)
- Outbound / recipes (different concern): [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](INTEGRATION_EVENTS_AND_WEBHOOKS.md)
