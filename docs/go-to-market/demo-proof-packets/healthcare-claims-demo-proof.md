# Demo proof packet — Healthcare claims (policy-backed demo)

**Evidence basis:** **Demo-derived** · **Deferred scope** for production PHI environments

## Input assumptions

- Healthcare claims policy pack on synthetic/demo evidence only.
- No production PHI in demo corpus.
- Operator acknowledges demo tenant warning in proof JSON.

## Top findings (illustrative)

| Finding | Category | Evidence label |
| --- | --- | --- |
| PHI minimization rule triggered on narrative field | Policy | Demo-derived |
| BAA / production HIPAA attestation not in scope | Compliance | Deferred scope |
| Audit export path present | Auditability | Evidence-backed (structural) |

## Deferred (out of V1 scope)

- Production HIPAA BAA as legal attestation
- Customer-specific penetration test

## What not to claim

- Do not claim HIPAA compliance certification from this demo.
- Do not use for sponsor ROI dollars — baselines not collected.

## Next step

[`buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md`](../buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md)
