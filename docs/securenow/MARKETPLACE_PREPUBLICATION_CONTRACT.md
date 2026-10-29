# SecureNow Marketplace offer — prepublication contract (NOT LIVE)

**Status: HOLD / OWNER REVIEW ONLY.** This is not an approved transactable offer, not a listing in Partner Center, and does not authorize using the ArchLucid Marketplace subscription plans for SecureNow. SecureNow's controlled beta remains **NO_GO**.

## Proposed offer boundary

- **Product:** SecureNow — Azure security evidence/path analysis.
- **Customer:** authorized enterprise Azure security architect/operator; Reader-only inventory or authorized upload.
- **Delivered output:** evidence-classified possible access paths, ranked technical dimensions, advisory cut points, and explicitly limited later-snapshot verification.
- **Not offered:** autonomous remediation, observed exploitation, breach prevention warranty, unsupported cloud coverage, guaranteed savings or SOC certification.
- **Offer/plan IDs:** UNASSIGNED in Partner Center. Reserved private ids on the quote sheet are not a registration.
- **Private quote sheet (2026-10-29):** price, currency, tax posture, and payout identity are owner-approved only in [PRIVATE_PRICE_SHEET.md](PRIVATE_PRICE_SHEET.md). That sheet is not a public list price and does not enable billing.
- **Support SLA, security assurances, DPA, Partner Center plan, and live billing:** NOT APPROVED.

## Engineering entitlement contract (future implementation, not activation)

1. The Marketplace webhook must validate Entra issuer/audience, incoming offer/plan identity, and a cryptographically verified event before attempting any tenant mutation.
2. **Fail closed** when `offerId` is not an explicit, owner-approved SecureNow ID. Never infer a SecureNow entitlement merely because ArchLucid's `Team/Professional/Enterprise` payment succeeded.
3. Bind entitlements to tenant/workspace/project and product line `security`, including authorization on API routes; enforce explicit product isolation from architecture-review capabilities.
4. Idempotent activation, change-plan, suspension, cancellation and refund transitions must preserve existing audit and transaction constraints.
5. Include negative tests for cross-product entitlement, foreign-tenant token, replayed webhook, mismatched offer ID and revoked subscription.
6. Run in a disabled environment with fake Partner Center callbacks and no real subscriber or payment. **No live toggle** until SecureNow beta GO, billing owner approval, verified webhook and rollback tests.

## Human-only release gates

Partner Center offer creation, a CPA tax determination, DPA/legal, a support SLA, positive beta release decision, live Azure identity/isolation tests, and owner sign-off to publish. The private quote sheet does not satisfy these gates.

**Existing shared architecture:** [ArchLucid Azure Marketplace offer](../go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md) is an implementation reference only. Do not reuse its subscription ID as the proof of SecureNow access.

**Automated gap report:** run `python3 scripts/ci/build_two_product_commercial_workpack.py --out-dir artifacts/commercial-readiness`; examine priority 09. That script intentionally cannot return `READY_TO_PUBLISH`.


## Automated product-line collision and authorization hold audit

`python3 scripts/ci/audit_securenow_marketplace_prepublication.py --output artifacts/commercial-readiness/securenow-marketplace-prepublication.json` inspects the actual shared billing-provider webhook dispatch, global Marketplace offer configuration, beta NO_GO statement, and this prepublication contract. It reports **HOLD_NO_PUBLICATION**, with explicit blockers for missing pre-mutation offer verification, cross-product entitlement negative tests, owner pricing approval, and actual beta release GO. No architecture subscription can be assumed to grant SecureNow.

An optional local `--candidate /secure/path/manifest.json` can declare `productLine=security`, `offerId`, `archlucidOfferId`, and `billingEnabled` for offline collision checks. Identical offer IDs are blocked; attempted billing enablement without releases is flagged. Values supplied by an operator are **not proof** of Partner Center approval, actual entitlements or release readiness. This is an evidence gate, not production enforcement; **do not enable commerce until a separate, tested runtime authorization boundary exists**.
