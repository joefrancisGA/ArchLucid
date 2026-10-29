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


## Candidate-test attribution (GTM-01)

The offline beta smoke now emits `artifacts/securenow-beta/requirement-attribution.json` for all **22** requirements, including the exact tested commit, workflow run and any relevant candidate tests actually observed in TRX. This is a **triage tool**, not authority to change matrix statuses to PASS. Missing tests, failures, and no mapping remain blockers; even a passing test never proves an entire requirement or the live staging release gates. See `scripts/ci/report_securenow_beta_requirement_attribution.py` and its tests.

### Core TRX candidate provenance guard (GTM-01 follow-up)

The offline smoke workflow now **runs** the existing `SecurityEvidencePathGuardTests` Core tests in Release mode and retains their TRX alongside the Application and Architecture TRX files. VSTest often writes method-only `testName` attributes; the attribution parser resolves `testId` through `TestDefinitions/UnitTest/TestMethod` before matching the class-name filter. This enables honest *candidate* observations for `FR-EV-03` and `NFR-02` without asserting either requirement PASS.

The offline gate now requires a successful Core test step **and** both rows to show observed, passing Core candidates in the attribution artifact matching that Actions run ID and tested SHA. Missing/empty/unparseable TRX, failed tests, incorrect run provenance or absent mappings fail the **offline** check; every published report still sets `beta_release_decision=NO_GO`. This does not validate production evidence, tenant isolation, Azure staging, data provenance or the adequacy of a requirement's test coverage.
