# SecureNow GTM-05 — controlled pilot contract drift audit

**State: HOLD.** The controlled pilot document is an internal, unpriced proposal. This checker is an offline source-consistency test, **not** a release gate approval, contract review, offer authorization, or claim that a pilot was delivered.

## Why it exists

Pilot descriptions can drift as commercial copy changes. The audit detects if a once-bounded proposal silently drops explicit NO_GO messaging, owner signoffs, negotiated commercial terms, external-change responsibility, later-capture verification requirements, or links to current beta evidence. It also rejects a broken 22-row requirement index and missing/symlinked evidence documents. A source edit that checks off an owner action in Markdown is treated as drift, **not** consent.

## Commands

```sh
python3 -m unittest scripts.ci.test_audit_securenow_controlled_pilot_contract -v
python3 scripts/ci/audit_securenow_controlled_pilot_contract.py \
  --output artifacts/commercial-readiness/securenow-controlled-pilot-contract.json
```

The non-deploying CI workflow triggers on changes to the draft, the beta matrix, evidence references, auditor, tests, and workflow. It emits a machine-readable JSON file with **reason codes only** (no copied offer text, customer names, prices, subscription IDs, authorization tokens, or evidence records). If source drift occurs, the audit exits nonzero.

Even if every draft invariant passes, the JSON status is always `HOLD_OWNER_APPROVAL_REQUIRED`, and `offerApproved`, `betaGo`, `publicationAllowed`, and `customerOutcomeObserved` remain false. Clean CI indicates documentation consistency **only**.

## Review boundaries

Release owner must separately approve the SecureNow 22-row beta evidence, live staging authentication, tenant/workspace isolation, Reader collection, recovery/rollback and support. Business/legal owners must separately authorize scoped customer access, data processing, real pricing, contractual terms and buyer communications. No CI job can grant these permissions.

This source audit is intentionally strict about the draft's existing headings, owner checklist, milestone sequence and explicit hold wording. Legitimate rewrites may require updating the checker and its negative regression tests together; never disable a failing invariant to manufacture a launch-readiness claim.
