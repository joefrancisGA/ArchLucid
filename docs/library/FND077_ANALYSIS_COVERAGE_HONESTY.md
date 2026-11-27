# FND-077 analysis coverage and recovery honesty

## Contract

Coverage describes the recorded evaluation scope. It is not a finding count, a capture outcome, a compliance assertion, or a finalization decision. Consumers may state that no findings were found **in the evaluated scope** only if the corresponding result set is empty and `canAssertAbsence` is true. Never treat an absent coverage field or an empty list as evidence of absence. Preserve valid findings and path identifiers regardless of coverage.

| Field | Interpretation |
| --- | --- |
| `scope` | Authority finding engines or SecureNow attack paths, not the entire environment |
| `state` | `complete`, `incomplete`, `failed`, `pending`, `stale`, `not_applicable`, or `unknown` |
| `freshness` and `evidenceAsOfUtc` | Freshness is independent of completion. Historical completion applies to recorded evidence only. A stale or unverified result cannot support an absence claim. |
| `recovery`, `stages`, `reasonCodes`, `missingSources` | Allowlisted evaluation or recovery observations. A missing producer or a legacy value without explicit proof is unknown, not automatically not applicable. |
| `advisoryOnlyDegradation` | Only advisory finding engines were recorded as failed. This does not bypass existing strict policy or establish absence. |

## Authority

The run and buyer detail routes project the recorded findings header and engine failures. Missing and header-only outputs cannot establish an empty evaluation. Requirement comparison reports bounded recovery, including exhaustion. Required/safety-critical failures continue to block decisioning and cannot enter direct finalization. Advisory-only degradation remains subject to existing strict policy. The new coverage block is added when supported career exports are rendered from source material. Stored sealed records and archived or signed bytes are not rewritten.

## SecureNow

The snapshot-bound attack-path report and its JSON download use the same projection. A successful capture is only one input. Complete requires the exact project/snapshot admission, an accepted checkpoint, matching evidence and path witnesses, and no reported search or evidence gaps. Vulnerable paths without ranks remain linked without fabricating rankings. Historical legacy captures without a verified analysis receipt are unknown even if they contain positive results. Dependency-rejection reasons are allowlisted on fenced failed checkpoints. A successful resumed checkpoint becomes eligible if its witnesses still verify. It does not rewrite older snapshots.

## Rollout

No change to FND-075/FND-076 opt-in switches. Keep existing rollout and master build policy. On an approved non-production scope with recovery enabled, compare pending, exhausted, incomplete and resumed evidence against the saved scoped checkpoints and check the run details, findings workspace, downloaded path report, and freshly generated export. Verify older clients and archived bytes separately. The same-repository OpenAPI snapshot refresh workflow regenerates the contract artifacts after a PR opens. Confirm it finishes before marking the PR ready.
