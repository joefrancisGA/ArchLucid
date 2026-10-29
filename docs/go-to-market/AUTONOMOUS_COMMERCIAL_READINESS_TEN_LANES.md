> **Scope:** Internal offline commercial-readiness evidence checks for engineering reviewers; not a launch approval, customer proof, or buyer-facing offer.

# Autonomous engineering workpack — ten low-scoring business/marketability priorities

**Status:** Internal engineering preparation, NOT commercial launch certification, a customer result, financial attestation, security release GO, or an approved offer. This workpack is built to produce machine-readable *gaps* and safe demo material without any real customer interaction or infrastructure change.

## What actually shipped

| Priority | Product | Engineering artifact | What it does | What it cannot claim |
|---|---|---|---|---|
| 01 | SecureNow | `report_securenow_beta_requirement_attribution.py`, existing offline beta CI | Links all 22 requirements to candidate tests observed in this specific CI run; never auto-PASSes a requirement | Does not approve beta or verify live Azure/staging |
| 02 | ArchLucid | `build_two_product_commercial_workpack.py` G4 audit | Reads the canonical claim gate and optionally validates an operator-supplied run-index *candidate* checklist | Does not create or attest to three Real pilot runs |
| 03 | SecureNow | `securenow-synthetic-demo.json` | Deterministic illustrative scope → path → advisory cut point → deliberately NOT VERIFIED postcondition | No evidence of attacker traffic, incident prevention or customer accuracy |
| 04 | Both | Buyer first-hour route/e2e inventory | Identifies available ArchLucid first-run E2E entry points and the SecureNow buyer demonstration checklist | Does not execute a live browser or certify real first-value timing |
| 05 | SecureNow | `CONTROLLED_PILOT_OFFER.md` owner checklist + workpack | Keeps scope, legal/pricing/security approvals clearly blocked; maps draft offer components | Is not an approved or priced offer |
| 06 | ArchLucid | `report_pricing_quote_cohort_safety.py` | Extends existing SQL/export/weekly quote SLA pipeline with aggregate aging and candidate duplicate counts, no email/name output | Does not merge contacts or show any conversion improvement |
| 07 | Both | `--economics-input` optional schema | Reports modeled/metered/invoice-labeled cost-per-unit; never invents real invoice or gross margin | Cannot report verified margin without revenue and reconciled costs |
| 08 | Both | `score_blinded_buyer_comparison.py` | Validates paired reviewer rubrics and emits descriptive dimension deltas | Does not declare a market winner, even with synthetic favorable scores |
| 09 | SecureNow | SecureNow Marketplace readiness lane + separate draft | Flags product entitlement isolation, publisher identity, beta GO and owner pricing as unresolved, with live fulfillment disabled | Cannot publish, transact or imply Partner Center approval |
| 10 | Both | Static buyer-copy claim scanner | Flags possible guaranteed-ROI, certification, autonomous remediation and customer-outcome claims with file/line only | Heuristic, not legal review or an externally verified truth audit |

## Run the independent checks

```sh
python3 -m unittest \
  scripts.ci.test_report_securenow_beta_requirement_attribution \
  scripts.ci.test_build_two_product_commercial_workpack \
  scripts.ci.test_report_pricing_quote_cohort_safety \
  scripts.ci.test_score_blinded_buyer_comparison -v
python3 scripts/ci/check_securenow_beta_evidence.py
python3 scripts/ci/build_two_product_commercial_workpack.py \
  --out-dir artifacts/commercial-readiness
```

The PR CI workflow executes these offline tests and uploads `commercial-readiness.json`, `commercial-readiness.md`, and `securenow-synthetic-demo.json`. Every workpack run includes a **NO_GO** beta posture, a G4 HOLD that cannot be silently promoted, and separate human-only blockers. It does not require or transmit tokens, cloud credentials, buyer identifiers or quotes.

The beta offline workflow separately emits `artifacts/securenow-beta/requirement-attribution.json` tied to **Git SHA and Actions run ID**. Candidate matches are signals of relevant tests executing, **not** automatically verified complete requirements.

### Optional operator inputs (never committed)

Quote report (aggregated, identifiers omitted from output):

```sh
python3 scripts/ci/report_pricing_quote_cohort_safety.py \
  --input /secure/path/quote-export.json \
  --as-of 2026-10-28T12:00:00Z \
  --output /secure/path/aggregate-quote-cohort.json
```

**Quote cohort integrity (GTM-06):** The PII-free aggregate rejects duplicate export request IDs, non-object rows, events before creation or after the chosen snapshot time, and future-dated requests. Such exports cannot silently suppress overdue response counts or inflate duplicate-lead estimates. Parser failures use generic errors to avoid echoing customer-provided timestamp text into logs. A clean aggregate is not proof of sales performance or conversion; the underlying export must remain in approved private storage.

Cost inputs use an explicitly supplied `archlucid.unit-economics-input.v1` document with `entries`: each has `product` (ArchLucid/SecureNow), `totalCostUsd`, `units`, and `basis` (MODELED / METERED_UNRECONCILED / INVOICE_RECONCILED). Even the latter string is only an **operator-supplied classification**, never independent Azure invoice proof. Gross margin is deliberately not guessed.

**GTM-07 denominator and cohort integrity:** Optional *structured* cost entries add **all four** descriptors: `unitKind` (`ANALYSIS_RUN`, `EVIDENCE_SNAPSHOT`, or `RESOURCE_REVIEW`), an opaque `cohortId` (1–64 ASCII letters/numbers/periods/underscores/hyphens), and `periodStartUtc` / `periodEndUtc` (exactly `YYYY-MM-DDTHH:MM:SSZ`, start strictly before end). Partial, malformed, duplicate (case-insensitive) cohort IDs and invalid intervals fail closed. Different cohort IDs with overlapping windows for the same product, cost basis and denominator are flagged for **owner double-count review**, not automatically called duplicate invoices. Adjacent periods are not overlaps. Cohort IDs and period dates are never reproduced in the generated workpack.

Legacy entries without descriptors still produce a *raw, untyped* arithmetic `costPerUnitUsd` for backward compatibility, explicitly labeled `UNSPECIFIED_UNIT_AND_PERIOD`. Entries with complete descriptors remain `STRUCTURED_COHORT_UNVERIFIED` unless overlapping, in which case `OVERLAPPING_PERIOD_REVIEW_REQUIRED` is emitted. This offline gate **never** certifies a comparison, aggregates invoices across entries, establishes a real usage denominator, verifies a billing source, computes revenue/gross margin, or upgrades a marketing claim. Real finance reconciliation and cost-scope allocation remain owner-only.

Paired comparison inputs use `archlucid.blinded-comparison-input.v1`, `product` (ArchLucid/SecureNow), `cohortClass`, and `cases` scored for evidenceTraceability, decisionUsefulness, timeEfficiency, uncertaintyHonesty, actionability (each 0–5) for both options per case and evaluator. Results cannot be used as a customer endorsement without actual approval.

## Problems to inspect after CI

1. **SecureNow beta 22/22 UNKNOWN:** Some candidate tests may have passed; source-to-requirement sufficiency and live gates remain unverified. The owner still must clear 22 rows and stage the real beta.
2. **ArchLucid G4 is HOLD:** No qualifying, independently verified three-real-run customer proof was recorded. The tool will not invent it.
3. **ArchLucid quote pipeline already exists:** The new aggregate report is additive; do not accidentally publish the underlying weekly report, which may contain names and emails.
4. **No measured unit economics:** Usage costs are often modeled. Require real invoice reconciliation and revenue before any actual margin statement.
5. **SecureNow Marketplace remains not configured for commerce:** The ArchLucid SaaS fulfillment scaffold is **not** evidence of SecureNow product-specific entitlement isolation.
6. **Synthetic demos and comparison rubrics are NOT market validation:** They support preparation and regression testing, but cannot increase real customer, conversion, or revenue scores.
7. **Marketing-copy scanning is heuristic:** File/line flags require a human to judge whether a phrase is a negated example, quote, or material buyer claim.
8. **Existing pricing and offer terms still require legal/owner signoff.** Nothing in this package changes checkout, billing, subscription activation, Azure infrastructure or production policy.

### Deliberately deferred work requiring people

Approved Azure Reader access and a live pilot, signed customer agreements, external SOC assurance, legal/tax credentials, customer references, actual payments, marketing distribution, CRM credentials and human approval of pricing/release changes. No autonomous workflow can honestly replace these steps.


## Additional code-level hardening (GTM-02 and GTM-04)

The G4 readiness lane now has `scripts/ci/audit_archlucid_three_real_proof_folders.py`, which validates **real outputs of the existing** `collect-first-pilot-proof.ps1` collector. Supply one `--proof-dir` per generated folder. Each folder is inspected for a distinct nonzero run UUID, SEND sponsor disposition, sponsor handoff, PASS real-mode evidence, captured execution-mode evidence, passing AI readiness, sponsor-safe ROI, no blocking findings and send eligibility. The resulting JSON contains only aggregate counts and reason codes, no customer or run IDs. Even 3/3 coherent summaries report **OWNER_VERIFICATION_REQUIRED**, never an automatic G4 PASS.

The first-hour product motion is checked by `scripts/ci/check_first_hour_buyer_journey_contract.py`: it guards the canonical ArchLucid review wizard and sponsor→manifest→graph→audit spine plus SecureNow brand/hydration and operator-home evidence section assertions. This is source-level drift detection; actual Playwright/Vitest browser execution is a separate CI task. Both scripts, plus offline failure-case tests, are included in the commercial-readiness workflow, and both emit JSON evidence.


### Additional Marketplace isolation gap detector (GTM-09)

`scripts/ci/audit_securenow_marketplace_prepublication.py` and its tests inspect the shared ArchLucid Marketplace webhook provider and offer configuration and produce a fail-honest **HOLD_NO_PUBLICATION** report in the ten-lane CI artifact. The report explicitly identifies missing SecureNow-specific offer-binding and product-entitlement negative tests; it does not activate billing or change the production webhooks. A supplied candidate manifest cannot override these blockers or confer owner approval.


### GTM-08: case-balanced buyer-comparison evidence (offline methodology guard)

The optional paired-score reporter requires **three distinct scenario/case IDs** before it emits descriptive dimension deltas. Multiple evaluators on the same scenario cannot be counted as three independent scenarios. It now uses the median reviewer delta *within each case* and then the median of those per-case deltas, giving each scenario equal weight rather than allowing a heavily reviewed case to dominate. Reports include the number of matched reviewer pairs and distinct cases but no IDs or raw scores. This is a methodology/anti-pseudoreplication guard, **not** proof of evaluator blinding, customer adoption, statistical significance, competitive superiority or ROI. The status remains descriptive and the winner field remains null.
