> **Reviewed:** 2026-07-26

# Architecture Review Packet: Retail Checkout and Loyalty API

**Classification:** Sanitized synthetic packet for principal architect evaluation  
**Domain:** Retail checkout / loyalty / payment-adjacent services  
**Length target:** 8–15 page review-session packet  
**Use:** Participant raw material for ArchLucid principal-architect insight validation

---

## 1. Business context

Contoso Retail Group is modernizing checkout and loyalty APIs for web, mobile, and store-associate channels. The system is payment-adjacent: raw card processing is delegated to a certified payment gateway, but the new API handles cart state, customer identity references, loyalty IDs, promotional eligibility, order submission, and payment-token references.

The packet is intentionally realistic rather than polished. It includes open questions, scope deferrals, cross-boundary assumptions, and implementation notes that may or may not be acceptable depending on risk tolerance.

---

## 2. System overview

| Component | Description |
|---|---|
| API Gateway | External entry point for web and mobile clients |
| Checkout Orchestrator | Coordinates cart, loyalty, payment token, and order submission |
| Cart Service | Stores active cart state |
| Loyalty Profile Service | Looks up loyalty tier and offer eligibility |
| Promotions Service | Calculates discount rules |
| Redis Cache | Caches cart and loyalty snippets |
| Order Database | Stores order records and checkout status |
| Fraud Event Integration | Shares selected order events with fraud SaaS |

---

## 3. User types and trust boundaries

| Actor | Trust origin | Interaction |
|---|---|---|
| Anonymous shopper | Internet | Web/mobile API |
| Authenticated customer | Internet | Checkout and loyalty |
| Store associate | Corporate network | Associate app |
| Payment gateway | External processor | Token exchange/callback |
| Fraud service | Third-party SaaS | Event subscription |
| Support agent | Internal | Admin console |

Reviewers should pay special attention to where data, identity, operational responsibility, and auditability cross boundaries.

---

## 4. Main request and data flows

1. Cart update writes cart state and caches summary in Redis.
2. Loyalty evaluation reads tier/segments and caches eligibility for 20 minutes.
3. Checkout validates cart, confirms payment token reference, writes order, and emits event.
4. Payment callback updates order status asynchronously.
5. Fraud service receives order-submitted events with selected customer and risk signals.

---

## 5. Data classification and retention

| Data category | Classification | Retention |
|---|---|---|
| Cart contents | Customer behavioral/commercial | 30 days active |
| Loyalty ID and segment | Personal/derived customer data | Account lifetime / 180 days |
| Payment token reference | Sensitive payment-adjacent | 90 days |
| Order record | Business/customer record | 7 years |
| Fraud event | Third-party shared data | Contract TBD |

---

## 6. Security and identity model

- API Gateway terminates TLS and validates JWTs.
- Anonymous sessions are permitted for cart operations.
- Redis is private-network accessible.
- Redis entries include cart summary, loyalty tier, promotion eligibility, customer reference ID, and sometimes payment token reference.
- Support agents can search by order ID, customer ID, or payment token reference.
- Fraud service receives customer ID, loyalty tier, order amount, paymentTokenRef, and risk signals.

---

## 7. Reliability, resiliency, and performance

- Checkout p95 under 700 ms normally; 1.5 s during promotion peaks.
- Availability target is 99.95% for checkout submission.
- Peak load is 10,000 checkout submissions/minute.
- Regional failover is planned between East US and West US.
- Order DB replication approach is undecided.
- Redis failover/cache warmup are not in pilot scope.

---

## 8. Operational model

The operating team intends to use standard CI/CD deployment with environment-specific configuration, centralized logs, metrics, and alerting. Some business operations are business-hours only, while the technical platform has after-hours escalation for critical incidents. Reviewers should examine whether the stated operational model is sufficient for the stated business goals, data sensitivity, and pilot commitments.

---

## 9. Architecture decisions / ADRs

### ADR-001: Cache loyalty snippets in Redis

**Decision/rationale:** Reduce latency during promotions; accept staleness risk.

### ADR-002: Use payment token reference only

**Decision/rationale:** Avoid raw PAN; token refs still sensitive.

### ADR-003: Central checkout orchestrator

**Decision/rationale:** Reduce duplicated logic; accept critical-path concentration.

### ADR-004: Defer full EU active-active design

**Decision/rationale:** EU launch not in first pilot.

---

## 10. Known constraints and open questions

The pilot is time-boxed and intentionally defers some production-hardening work. Reviewers should distinguish acceptable pilot risk from decisions that are likely to become unsafe production defaults.

Common review prompts:

1. Which deferred decision creates the greatest future risk?
2. Which trust boundary is least clearly protected?
3. Which operational assumption could fail during the first pilot?
4. Which evidence item is strongest?
5. Which finding would require immediate mitigation before launch?

---

## 11. Evidence appendix

```json
{
  "key": "cart-summary:cust_448212:cart_7719",
  "ttlMinutes": 20,
  "value": {
    "customerRef": "cust_448212",
    "loyaltyTier": "Gold",
    "promoEligibility": ["FLASH15", "LOYALTY5"],
    "cartTotal": 184.32,
    "paymentTokenRef": "tok_live_77a9"
  }
}
```

```json
{
  "eventType": "OrderSubmitted",
  "orderId": "ord_88901",
  "customerId": "cust_448212",
  "loyaltyTier": "Gold",
  "orderAmount": 184.32,
  "paymentTokenRef": "tok_live_77a9",
  "riskSignals": ["new-device", "promotion-stack"]
}
```

Promotion rules are deployed through a business console. The console does not currently require dual approval. Regional failover uses DNS; database and cache behavior remain undecided.

---

## 12. Participant scoring prompts

Use these during or after review:

1. Which finding would you not have written yourself in a first pass?
2. Which finding is wrong, unsupported, or overclaimed?
3. Which finding would change approval conditions, remediation priority, or launch readiness?
4. Where is the evidence trail stronger than a raw frontier-AI review?
5. Would you reuse this for a second review cycle?
