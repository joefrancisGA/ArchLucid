> **Scope:** Contributor-reference — GoldenManifest content-schema evolution for historical readability (TB-1277); not a buyer-facing trust claim.

# GoldenManifest content-schema evolution contract

**Status:** Active (V1)  
**Backlog:** **TB-1277** (this contract) · **TB-1278** (anti-schema-column-as-readability / dual-write-upgrades-history / rewrite-sealed honesty CI — **Done** 2026-08-11)  
**Audience:** Principal architects, platform reviewers, coding agents  
**Related:** [COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md](./COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) (**TB-1003**) · [APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md](./APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md) (**TB-1009**) · [MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_CONTRACT.md](./MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_CONTRACT.md) (**TB-1156**) · [DAPPER_DDL_SATELLITE_BREAKDOWN_SIGNALS_CLAIM_MAP.md](./DAPPER_DDL_SATELLITE_BREAKDOWN_SIGNALS_CLAIM_MAP.md) (**TB-1263**) · [JSON_FALLBACK_AUDIT.md](./JSON_FALLBACK_AUDIT.md) · [EVIDENCE_IMMUTABILITY.md](./EVIDENCE_IMMUTABILITY.md) · ADR [0039](../architecture/adrs/0039-append-only-sealed-evidence.md) / [0040](../architecture/adrs/0040-golden-manifest-schema-evolution.md) / [0045](../architecture/adrs/0045-golden-manifest-immutability.md) · GTM **M-223** / **M-224** · Done **TB-303** / **TB-307** / **TB-575** · open **TB-1157** (production hasher re-lock)

---

## 1. Purpose

Name how **committed golden manifest content** evolves across product releases while **sealed rows stay readable** — without rewriting history, conflating storage dual-write with content migration, or treating a `SchemaVersion` field as the primary compatibility story.

**One line:** **Tolerant / upcasting readers** are primary; `SchemaVersion` is activate-or-retire; dual-write is **storage** compat only; sealed packages are **never** rewritten.

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| “A `SchemaVersion` column upgrades sealed history.” | No SQL `SchemaVersion` column is the V1 readability mechanism; CLR `ManifestDocument.SchemaVersion` defaults to `1` and is **not** in production `ManifestHash` projection today (**TB-1156** §Hasher A). |
| “Dual-write windows migrate sealed manifest content.” | Dual-write / satellite layout (**TB-1263**) is storage-layout compat — not an in-place content upcast of sealed bytes. |
| “Shipping a new section rewrites old packages.” | Sealed `dbo.GoldenManifests` rows are append-only; corrections are new commits or disclosed supersede paths (**TB-1009** / ADR 0039). |
| “Projection evolution rewrites sealed packages.” | `AuthorityCommitProjectionBuilder` lossiness affects **new** contract projections; it does not mutate stored sealed JSON. |
| “Schema bump automatically moves `ManifestHash`.” | Hash-affecting changes use deliberate re-lock rituals (**TB-1156** / **TB-1157**) — separate from reader tolerance. |

---

## 3. Primary mechanism — tolerant / upcasting readers

| Rule | V1 behavior |
|------|-------------|
| Missing section / column | Default-empty on read; UI and exporters must not treat absence as corruption when the section post-dates the commit. |
| Unknown JSON property | Ignore on deserialize (`JsonSerializer` / contract DTO tolerance); do not fail sealed-row reads for forward-compatible adds. |
| New satellite table | Read path joins or defaults; writers may dual-write for **storage** compat (**TB-1263**) — not a backfill that rewrites sealed LOB bodies. |
| Sealed row mutation | **Forbidden** — new product behavior ships via tolerant readers + new commits only. |

**Code anchors:** `ManifestDocument` (`ArchLucid.Core/Manifest/ManifestDocument.cs`); contract `GoldenManifest` projection via `AuthorityCommitProjectionBuilder`; blob envelope `GoldenManifestPayloadBlobEnvelope.CurrentSchemaVersion` (`ArchLucid.Persistence/BlobStore/GoldenManifestPayloadBlobEnvelope.cs`).

---

## 4. `SchemaVersion` decision (activate or retire)

| Surface | Today | V1 contract |
|---------|-------|-------------|
| `ManifestDocument.SchemaVersion` (CLR) | Defaults to `1`; documented on type | **Optional metadata** — not persisted as a SQL column on `GoldenManifests`; **not** in `ManifestHashService` canonical projection (**TB-1156**). |
| `GoldenManifestPayloadBlobEnvelope.schemaVersion` (blob offload) | `CurrentSchemaVersion = 1` on envelope | Envelope wire version for blob layout — bump only when blob **shape** changes; old blobs still read via tolerant envelope parsing. |
| SQL `SchemaVersion` column on golden manifest | **Absent** | Do **not** introduce as the primary “old rows stay readable” story unless a breaking wire shape forces an explicit ADR + migration plan. |

**Activate path (future):** persist `SchemaVersion` on new writes, gate **writers** and document reader branches — still **no** rewrite of sealed rows.  
**Retire path:** keep field at default `1` and rely on tolerant readers only — document in ADR when chosen.

---

## 5. Add-path matrix

| Change type | Reader strategy | Writer / storage | Sealed-row impact |
|-------------|-----------------|------------------|-------------------|
| New optional JSON property on existing column | Ignore-unknown + default on missing | Ship in next release | None — old rows deserialize |
| New manifest section (new JSON column) | Default-empty section object | Add column; optional dual-write to satellite (**TB-1263**) | None — old rows omit column |
| New satellite table for hot-path projection | Read prefers satellite when present; fallback to authority LOB | Dual-write window per **TB-1263** ladder | None on sealed authority row |
| Breaking rename / type change of existing field | **Forbidden** without new commit type or explicit migration ADR | New field name alongside old (read both) or new major version | Never in-place UPDATE of sealed body |
| Hash-affecting semantic change | N/A for reader tolerance alone | **TB-1157** production re-lock + cohort ritual if fingerprint moves (**TB-1156**) | Old `ManifestHash` identity preserved for old commits |

---

## 6. Asymmetry pin (projection vs persisted vs hash)

Policy / Feasibility / EffectiveGovernance detail on the authority `ManifestDocument` may **hash** (`ManifestHash`) differently from what operators see on the contract `GoldenManifest` projection — see **TB-1156** §Projection bridge. Content-schema evolution **does not** close that gap; it only guarantees **readability** of stored sealed inputs.

| Layer | Evolution owner |
|-------|-----------------|
| Sealed SQL / blob bytes | **This contract** — no rewrite |
| Authority → contract projection | **TB-1156** lossiness table |
| Production vs cohort hashers | **TB-1156** / **TB-1157** |
| Storage satellite dual-write | **TB-1263** |

---

## 7. Operator / PA review

1. Ask whether “schema upgrade” means **reader tolerance** or a **rewrite** of sealed rows — only the former is V1-honest.
2. Confirm dual-write language is scoped to **storage layout**, not historical content migration.
3. Confirm hash-affecting changes use **re-lock** rather than claiming bit-identical old packages (**M-198** / **M-202**).
4. Treat “`SchemaVersion` keeps every old manifest upgraded” as a review finding.

---

## 8. Claim boundary (GTM **M-223** / **M-224**)

| Safe | Unsafe |
|------|--------|
| “Tolerant readers; missing sections default empty.” | “`SchemaVersion` upgrades history.” |
| “`SchemaVersion` activate-or-retire when documented.” | “Dual-write migrates sealed content.” |
| “Sealed packages are never rewritten.” | “Projection evolution rewrites sealed packages.” |
| “Hash-affecting changes re-lock deliberately.” | “New sections silently change old `ManifestHash`.” |

Buyer handout: [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-224](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#manifest-content-schema-evolution-m-224). Path-stable alias: [MANIFEST_CONTENT_SCHEMA_EVOLUTION_PA_ONE_PAGER.md](../go-to-market/MANIFEST_CONTENT_SCHEMA_EVOLUTION_PA_ONE_PAGER.md).

---

## 9. Enforcement surfaces (follow-on)

| ID | Role |
|----|------|
| **TB-1278** | **Done** (2026-08-11) — `scripts/ci/check_manifest_schema_evolution_honesty.py` forbids “SchemaVersion upgrades history,” “dual-write migrates sealed content,” and “rewrite sealed packages” stubs in buyer/WNTP-adjacent paths without **TB-1277** caveats; wired in `run_buyer_surface_strict_guards.py` |
| **TB-1157** | Production `ManifestHashService` deliberate re-lock — hash surface, not reader tolerance |
| **TB-1263** | Dapper/DDL/satellite dual-write ladder — storage compat only |

---

## 10. Explicit non-goals

- Rewriting sealed `GoldenManifest` bodies or backfilling historical commits.
- Re-opening Done seal/verify IDs (**TB-303** / **TB-307** / **TB-575**).
- Replacing **TB-1156** hasher/projection matrices or implementing **TB-1157** in this row.
- ORM migration or satellite ladder implementation (**TB-1263** implementation rows).
