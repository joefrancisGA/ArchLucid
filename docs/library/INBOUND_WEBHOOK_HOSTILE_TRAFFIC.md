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
6. **Idempotent handler** — replay/event-id guard where the vendor can retry (**TB-968** for ITSM; billing already has `IBillingWebhookReplayGuard`).

**Still true from INV-015 / TB-012:** never parse untrusted JSON **before** authenticity verification. Rate and size must **precede** verify for DoS realism; verify must still precede parse.

---

## Surface inventory (engineering snapshot)

Legend: **Y** = present and roughly aligned · **P** = partial · **N** = missing / tracked.

| Surface | Controller | Rate | Size before allocate/HMAC | Verify before parse | Replay / idempotency | Notes |
|---------|------------|------|---------------------------|---------------------|----------------------|-------|
| ITSM Jira / ServiceNow | `ItsmInboundWebhooksController` | Y (`fixed`) | P — cap **after** full `ReadToEndAsync` (UTF-8 byte count vs `MaxInboundWebhookPayloadUtf8Bytes`) | Y | N → **TB-968** | Architecture tests lock size→verify→parse after read |
| Stripe billing | `BillingStripeWebhookController` | Y | N → **TB-967** | Y (provider) | Y (`IBillingWebhookReplayGuard`) | Unbounded `ReadToEndAsync` today |
| Azure Marketplace | `BillingMarketplaceWebhookController` | Y | N → **TB-967** | Y (JWT in provider) | Y (same guard family) | Same body-read pattern as Stripe |
| Slack interactivity | `SlackInteractivityController` | Y | N → **TB-967** | Y (Slack sig) | P — vendor timestamp skew only; not billing ledger | Inbound form body |

Outbound webhook **delivery**, dry-run, and connection-management APIs are **out of scope** for this hostile-**inbound** contract.

---

## Hostile-internet checklist

Use when adding a new inbound webhook surface or reviewing an existing one:

| Control | Expectation |
|---------|-------------|
| Edge TLS / WAF | Documented for hosted SaaS; do not claim it completes app-layer hardening |
| App rate limit | Attribute or middleware on the inbound route |
| Bounded body | Reject oversize **before** unbounded allocate and before crypto (**TB-967**) |
| Content-Type allowlist | Reject unexpected media types where vendors are fixed |
| Fail-closed secrets | Missing/empty shared secret → **401/403**, not soft accept |
| Constant-time compare | Shared-secret / HMAC compare via `WebhookSecrets.SecureEquals` (or equivalent) |
| Verify before parse | No `JsonDocument.Parse` / schema bind on unverified bodies |
| Freshness / replay | Timestamp skew and/or durable event-id ledger (**TB-968** for ITSM) |
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
- ITSM inbound is **not** replay-safe until **TB-968**.
- Billing replay does **not** imply Stripe/Marketplace bodies are size-bounded (**TB-967**).

---

## Follow-on engineering

| ID | Owns |
|----|------|
| **TB-967** | Bounded body intake (`Content-Length` / pre-read max) across inbound controllers — size before HMAC |
| **TB-968** | ITSM inbound replay/idempotency + freshness parity with billing |

---

## Related

- [INV-015](ARCHITECTURE_INVARIANTS.md#inv-015-inbound-webhook-pipeline-order)
- Billing replay ops: [`BILLING_WEBHOOK_REPLAY_GUARD.md`](../runbooks/BILLING_WEBHOOK_REPLAY_GUARD.md)
- Outbound / recipes (different concern): [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](INTEGRATION_EVENTS_AND_WEBHOOKS.md)
