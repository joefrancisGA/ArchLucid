> **Scope:** Contributor-reference — SecureNow path ranking dimensions, weights, and API surfaces. Internal engineering only.

# SecureNow path ranking (SA-09)

Rule version: **`SA09-rank-v1`**

Path ranking helps operators sort `SecurityEvidencePath` rows like an architect — not like CVSS. There is **no** multiplicative magic score and **no** percentage confidence.

## Dimensions (each capped at 4.0)

| Dimension | What it measures | Cap |
|-----------|------------------|-----|
| **Technical exposure** | Public exposure, unrestricted egress, path-kind signals | 4.0 |
| **Privilege depth** | Read/write/role/identity hops along the path | 4.0 |
| **Blast radius** | Shared-control fan-out, distinct downstream resources | 4.0 |
| **Business consequence** | Crown-jewel assertion linkage when present; otherwise **Unknown** | 4.0 |
| **Confidence band** | Path confidence band (Confirmed strongest) | 4.0 |

Stored scores use decimals with two fractional digits. **`RankOrder`** is 1-based within a snapshot (1 = highest composite sort).

## Sort policy

Default policy is a **weighted sum** of dimension scores:

| Dimension | Default weight |
|-----------|----------------|
| Technical exposure | 0.25 |
| Privilege depth | 0.20 |
| Blast radius | 0.20 |
| Business consequence | 0.15 |
| Confidence band | 0.20 |

Tie-breakers (after composite sort score): technical exposure desc, confidence band desc, `PathId` asc.

### Unknown business consequence

When `CrownJewelAssertionId` is absent, **`BusinessConsequenceScore` is stored as null** (Unknown).

The composite sort key uses a **neutral 2.0** for that dimension — neither zero nor maximum — so a catastrophic technical path is **not** demoted solely because PHI/crown-jewel classification is missing.

When an assertion is linked (SA-18), the stored consequence score reflects that linkage only while the assertion remains **Active** and unexpired. Expired or revoked assertions revert to Unknown.

### Defender posture (IE-02 companion)

When `defender-summary.json` materializes for the snapshot subscription, the ranking engine loads the ordinal posture band (`Low` / `Medium` / `High`) and applies a **blast-radius dimension adjustment** only:

| Ordinal band | Blast-radius adjustment |
|--------------|-------------------------|
| Low | +0.50 |
| Medium | +0.25 |
| High | +0.00 |
| Unknown / missing companion | +0.00 |

Breakdown `source` strings include `defender-posture-low|medium|high` when present. Numeric secure scores never appear in rank prose or API buyer fields.

Rank detail GET (`/paths/{pathId}/rank`) dimension prose includes the ordinal Defender posture band in the blast-radius paragraph when breakdown sources carry a defender token.

## Tenant-configurable weights

Tenants may persist custom weights in `SecurityEvidencePathRankWeights` (JSON map of dimension name → weight). The ranking engine reads these during post-materialize. LLM output must **not** write rank rows.

## APIs

- `GET /v1/operational-security/paths/ranked` — paged ranked paths for the scope (optional `snapshotId` filter)
- `GET /v1/operational-security/paths/{pathId}/rank` — dimension breakdown with deterministic prose

## Relation to IE-15

IE-15 remediation prioritization remains **finding-level** and is not replaced. Path ranks are independent persisted rows for SecureNow architect workflows (SA-10 cut points, SA-11 metrics).

## Persistence

- `SecurityEvidencePathRanks` — one row per path per ranking pass (replaced per snapshot after path engines run)
- Recomputed in post-materialize after shared-control blast-radius engine (SA-08)
