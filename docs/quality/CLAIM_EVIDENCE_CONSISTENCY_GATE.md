> **Scope:** T2-8 release claim discipline — deterministic checks that buyer-facing claims match in-repo evidence markers and deferred labels.

# Claim / evidence consistency gate

**Last reviewed:** 2026-06-06

## Purpose

Prevent trust, pricing, and procurement docs from drifting into unsupported strong claims (attestations issued, live marketplace checkout, full real-mode AI confidence while G5 is HOLD, etc.).

The gate composes:

- `check_compliance_posture_clarity.py` (formal attestation wording)
- `check_commercial_overclaim_guard.py` (marketing + extra prohibited phrases)
- `claim_evidence_rules.v1.json` (required evidence marker files + gate-conditional strong claims)

## Run locally

```bash
python scripts/ci/check_claim_evidence_consistency.py \
  --json-out artifacts/release-readiness/claim-evidence-consistency.json \
  --markdown-out artifacts/release-readiness/claim-evidence-consistency.md
```

```powershell
./scripts/ci/Invoke-ClaimEvidenceConsistencyGate.ps1 -OutputDir artifacts/release-readiness
```

## CI

`.github/workflows/ci.yml` runs the checker on every PR (non-blocking `continue-on-error: true` alongside existing TB-134 guard).

Release readiness bundle (`Emit-ReleaseReadinessEvidence.ps1`) includes the JSON/Markdown artifacts for reviewers.

## Fixtures

```bash
python scripts/ci/check_claim_evidence_consistency.py --fixture valid    # exit 0
python scripts/ci/check_claim_evidence_consistency.py --fixture invalid  # exit 1
```

## Related

- [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md)
- [`RELEASE_CLAIM_GATE.md`](RELEASE_CLAIM_GATE.md)
- [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md)
