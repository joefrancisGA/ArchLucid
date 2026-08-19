> **Scope:** Contributor reference — engineering source of truth — production `ManifestHashService` deliberate re-lock ritual and pinned baseline (**TB-1157**). Pairs cohort lock-baseline; does not replace it.

# Manifest hash hasher baseline (TB-1157)

> **Audience:** Contributors changing `ManifestHashService`, export verify, or replay paths.  
> **Dual-hasher contract:** [`MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_CONTRACT.md`](./MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_CONTRACT.md) (**TB-1156**).  
> **Buyer summary:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#manifest-dual-hasher-projection-evolution-m-199) (**M-198** / **M-199**).

---

## Decision in one line

Any change to the production canonical projection (`ManifestHashService`) requires a **deliberate baseline re-lock** in the same PR — not a silent merge.

---

## Current baseline

| Field | Value |
| --- | --- |
| **Hasher schema version** | `v1` (`ManifestHashService.HasherSchemaVersion`) |
| **Fixture** | `BaseManifest` in `ArchLucid.Decisioning.Tests/ManifestHashServiceTests.cs` |
| **Committed artifact** | [`tests/manifest-hash/hasher-baseline-v1.json`](../../tests/manifest-hash/hasher-baseline-v1.json) |
| **Pinned SHA-256** | `4EA3362449DD7495917A4C2A46ACFB446C79FE173774B0301C11651A3EE38F1A` |

Recompute locally:

```powershell
dotnet run --project scripts/ci/manifest-hash-baseline-probe/ManifestHashBaselineProbe.csproj
```

---

## Re-lock ritual (production hasher A)

1. **Owner approval** — set `ARCHLUCID_MANIFEST_HASH_BASELINE_LOCK_APPROVED=true` for the shell running the re-lock (single-shot; same semantics as golden-cohort lock).
2. **Implement** projection / `HasherSchemaVersion` change in `ManifestHashService.cs`.
3. **Update** `tests/manifest-hash/hasher-baseline-v1.json` (or add `hasher-baseline-v2.json` when bumping version) and this document in the **same commit**.
4. **Run** `ManifestHashServiceTests.ComputeHash_MatchesPinnedBaseline_v1` (or successor) and export verify / replay tests as applicable.
5. **Document** migration: historical rows verify under prior version; new commits use bumped version after re-lock.

CI: `scripts/ci/assert_manifest_hash_hasher_baseline_locked.py` fails when `ManifestHashService.cs` changes without baseline artifact updates unless step 1 approval is set in CI env (local/owner only).

---

## Does **not** substitute for

| Ritual | Why separate |
| --- | --- |
| Golden-cohort `lock-baseline` | Hasher B (content fingerprint) — different projection |
| Mass SHA rewrite without review | **M-202** / **TB-1172** rubber-stamp guard |
| Sealed-row schema migration | **TB-1277** storage compat only |

---

## CI anchors

| Anchor | Purpose |
| --- | --- |
| `ArchLucid.Decisioning/Services/ManifestHashService.cs` | Primary diff trigger |
| `tests/manifest-hash/hasher-baseline-v1.json` | Committed golden hash |
| `ManifestHashServiceTests.ComputeHash_MatchesPinnedBaseline_v1` | Regression proof |
| `assert_manifest_hash_hasher_baseline_locked.py` | Pair service diff with baseline update |
| `ARCHLUCID_MANIFEST_HASH_BASELINE_LOCK_APPROVED` | Single-shot operator approval |

**Honesty CI follow-on:** **TB-1158** (if opened) — fail stubs equating cohort content SHA with production `ManifestHash`.
