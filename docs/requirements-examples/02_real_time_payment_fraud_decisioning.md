# Requirements Brief: Real-Time Payment Fraud Decisioning

## 1. Purpose

Fictitious Meridian Payments needs a decisioning service that scores card-not-present authorization attempts before they are sent to an acquiring bank. The service must combine transactional signals, customer/device history, and a versioned fraud model to return **approve**, **review**, or **decline**.

The platform must remain available during partial dependency failure without quietly converting missing evidence into a claim that a transaction is safe.

## 2. Scope

**In scope:** authorization scoring, feature retrieval, model inference, deterministic rules, decision explanation, analyst case creation, model/rule version governance, and operational monitoring.

**Out of scope:** settlement, chargeback processing, card issuance, and customer-facing account servicing.

## 3. Users and journeys

- Merchant gateway submits an authorization and receives a decision before its timeout.
- Fraud analyst reviews a flagged transaction, sees the decision factors and source evidence, and records a disposition.
- Model-risk officer approves a model version and can prove which version produced any historic decision.
- Site reliability engineer detects stale features, rising fallback decisions, and degraded dependency behavior.

## 4. Functional requirements

| ID | Priority | Requirement |
|---|---:|---|
| FR-01 | P0 | Accept an idempotent authorization request with merchant, amount, card token, device signal references, and correlation ID. |
| FR-02 | P0 | Evaluate deterministic policy rules and a versioned model; record their individual and combined contributions. |
| FR-03 | P0 | Return one of approve, review, decline, or explicit unable-to-score. Do not map inability to score silently to approve. |
| FR-04 | P0 | Create an analyst case for review decisions and support feedback labels. |
| FR-05 | P0 | Preserve the input identity, feature snapshot identity, rule version, model version, decision, reason codes, and confidence for each decision. |
| FR-06 | P1 | Support a controlled canary rollout and immediate rollback for model and policy versions. |
| FR-07 | P1 | Detect and surface feature drift, model-score distribution shift, and increased fallback rate. |

## 5. Quality attributes and constraints

| Area | Mandatory requirement |
|---|---|
| Latency | At least 99.9% of decision requests complete within 120 ms measured at the service edge, excluding merchant network time. |
| Throughput | Sustain 4,000 requests/second and withstand a burst of 10,000 requests/second for 15 minutes. |
| Availability | 99.99% monthly availability for the decision endpoint. |
| Correctness | Repeat delivery of the same idempotency key must return the original outcome and must not create a second case. |
| Security | Card data is tokenized before entering the service. Raw PAN and CVV must never be stored, logged, or transmitted to analytics. |
| Access | Analysts receive least-privilege access; only model-risk officers may approve a production model. All privileged actions are audited. |
| Explainability | Every decision must expose human-readable reason codes and distinguish observed facts from model inference. |
| Resilience | A feature-store timeout may trigger a policy-defined degraded path only when the response states what evidence was unavailable. |
| Retention | Retain decision provenance for 7 years and raw online features for 90 days unless a legal hold requires longer. |
| Cost | Normal operating cost target: no more than $0.0018 per scored authorization, excluding third-party intelligence feeds. |

## 6. Known workload facts

- 70% of traffic is from North America, but global merchants are planned in year two.
- Fraud rules change weekly; model candidates are released monthly.
- Feature sources include device reputation, account history, merchant risk, and transaction velocity.
- Device reputation may be unavailable for up to two minutes during a vendor incident.
- An acquiring bank may retry an authorization request three times after a network timeout.

## 7. Decisions required / incomplete evidence

- Data-residency obligations for future non-U.S. traffic are unknown.
- The formal loss threshold that separates review from decline has not yet been set.
- The organization has not chosen an accountable owner for 24×7 model rollback.
- It is undecided whether analyst feedback can be used automatically for retraining or requires human curation.

## 8. Architecture deliverables requested

Generate an event and request path diagram, a low-latency component architecture, and a model-governance control plane. State how the design meets the latency and availability targets without sacrificing decision provenance. Identify degraded-mode behaviors, their evidence states, and their validation tests.
