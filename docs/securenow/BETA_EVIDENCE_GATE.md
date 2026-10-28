# SecureNow beta evidence gate

This is a **non-deploying**, offline release-evidence control for the SecureNow *security* product line, tracked under [issue #5367](https://github.com/joefrancisGA/ArchLucid/issues/5367). It does not certify ArchLucid's separate architecture-review beta.

## Current outcome

All 22 requirements are **UNKNOWN** for execution evidence until an operator or CI workflow records an observed result. Existing test files and shipped backlog entries are not proof of a passing run. The starter matrix records concrete test candidates only when source was inspected, not full coverage.

## Commands

```bash
python3 scripts/ci/check_securenow_beta_evidence.py
python3 scripts/ci/check_securenow_beta_evidence.py --strict
```

The first validates all required rows and honest status metadata; the second is deliberately **NO-GO** until all 22 entries have PASS supported by `test_command`, `result_reference`, and `commit_sha`. Do not make this strict check a mandatory PR CI job until a release owner approves the source of result evidence. Never mark PASS based only on the existence of a test.

Use `docs/securenow/BETA_EVIDENCE_MATRIX.json` to capture execution results for one candidate commit. A PASS needs a test command, a URL or immutable run/artifact identifier for its observed output, and the exact tested SHA. This structural checker does **not** verify external run authenticity or SHA freshness; human or CI provenance review remains required.

## Manual/staging release gates (additional, NOT covered by 22-item matrix)

- Real Azure Reader collection with consent and scope; failed/partial collection is surfaced, not treated as clean.
- Operator can trace ranked finding to path/hops and source references.
- Advisory remediation only, attested external change, later successful snapshot, substantive verified postcondition; no false closure.
- Negative cross-tenant and wrong-workspace live authorization probe.
- Rollback, on-call support, security/privacy approval, and any applicable institutional sponsor approval.

These must be separately documented before invitees are onboarded. No ARM writes, automatic apply, extra collector, mega-graph, numeric confidence, or added AI engines are authorized by this gate.
