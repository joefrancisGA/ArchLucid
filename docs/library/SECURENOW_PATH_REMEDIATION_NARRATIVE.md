# SecureNow path-aware remediation narrative (SA-14)

When a remediation instance (IE-13) is created from a finding that cites a `PathId`, ArchLucid persists a **structured architect narrative** on the instance — not a single LLM blob.

## Fields (`RemediationPathNarrative`)

| Field | Purpose |
| --- | --- |
| ProblemStatement | What path breaks |
| WhyItMatters | Confidence-band context |
| ExposureSummary | Path kind + weakest hop |
| AffectedDependencyCloudResourceIds | Concrete dependents from path hops |
| RecommendedChange | Prefer SA-10 cut point when present |
| Preconditions | Exception, frozen pattern, rollback, PE/DNS when applicable |
| BlastRadiusWarning | Lists CloudResourceIds — never generic “may affect systems” |
| SafeRolloutSteps | PE-first template for public-access cuts; generic otherwise |
| VerificationQueries | Pattern queries + `path:hash-absent` + property checks |

Optional `AiInferenceSummary` remains null in SA-14 (SA-17 may populate later).

## Public-access rollout template

1. Create private endpoint
2. Validate private DNS
3. Canary workload migration
4. Migrate remaining dependents
5. Disable public network access
6. Capture next snapshot and verify

## Verification queries

Reuses IE-13 query forms against a **later** snapshot than execution:

- `snapshot.resource.present`
- `property:key=value` (e.g. `property:enablePublicNetworkAccess=false`)
- `path:hash-absent=<canonicalHopHashHex>` — proves the cited path topology is gone

Execute remains advisory-only (`result=emitted`); no `terraform apply` or ARM mutation.

## Configuration / schema

Migration **384** adds `PathId` and `PathNarrativeJson` to `dbo.RemediationInstances`.

## Related

- `docs/library/REMEDIATION_INSTANCE_WORKFLOW.md` (IE-13)
- `docs/library/SECURENOW_CUT_POINTS.md` (SA-10 recommended change)
- `docs/library/SECURENOW_ARCHITECT_PLANE.md` §8
