# FND-001–015 initial architecture integration review

Status: Initial source-informed review, **not** final sign-off. Draft PRs must pass required CI/security and be reviewed against current master before merging.

## Foundation groups
- Contracts and extension boundary: FND-001–004.
- Evidence, identity, remediation and verification: FND-005–009.
- Authorization and read-only observation: FND-010–012.
- Measurement, simulation and rollout: FND-013–015.

## Findings and integration gates
1. **High — schema-only security is not runtime enforcement.** FND-004, FND-010 and FND-014 describe disabled execution, authorization and no side effects, but cannot enforce them without trusted server-side code. No customer write credentials or execution paths should be introduced by these PRs.
2. **High — provenance and authorization are not validated by JSON Schema.** FND-005, FND-008 and FND-009 need trusted digest/signature verification, authenticated tenant scoping, actor verification, audit event existence and later-snapshot ordering before operational use.
3. **Medium — existing contract duplication.** FND-006 overlaps accepted ADR 0063 normalizers; policy-rule case normalization differs between the two existing implementations. Preserve behavior until compatibility and migration tests exist.
4. **Medium — overlapping remediation states.** FND-007/008/014/015 must map to IE-13's approved pattern and remediation-instance state machine, rather than introducing a competing approval/execution path.
5. **Medium — measurement precision.** FND-013 path/blob interval union can overcount unchanged lines across revisions. Do not label this globally unique LOC until cross-revision lineage is established.
6. **Medium — graph API duplication.** FND-011 is an exchange envelope, not a second HTTP endpoint. Reuse the scoped temporal graph API and its sealed-manifest and 413/pagination guards.
7. **Medium — semantic vs integer versions.** New boundary envelopes use semver while legacy graph/finding DTOs use integers. Explicit adapters and contract tests are required.
8. **Medium — release cost.** Dedicated focused workflows reduce contract-test cost, but repository-wide required CI and merge protections still apply. Do not merge drafts on green focused checks alone.

## Recommended staged integration
A. Complete CI/security checks and merge isolated schema/ADR foundations only when eligible.
B. Implement one trusted tenant-scoped read-only adapter (FND-011) and independent evidence verification (FND-005), both behind disabled-by-default server-side gates.
C. Add an authorization enforcement adapter (FND-010) and correlation read model (FND-009), with adversarial cross-tenant and replay tests.
D. Only then evaluate dry-run runtime isolation (FND-014), remediation orchestration (FND-007/008/015) and measured quality reporting (FND-013).

No foundation is production-ready merely because its JSON Schema validates.
