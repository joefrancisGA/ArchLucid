> **Scope:** Contributor reference — engineering source of truth — Dapper/DDL/satellite dual-write breakdown signals and pre-ORM strategy ladder (**TB-1263**). Honesty CI **TB-1264**.

# Dapper / DDL / satellite breakdown signals contract (TB-1263)

> **Audience:** Contributors evaluating data-access complexity and ORM debates.  
> **Buyer summary:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#dapper-ddl-satellite-breakdown-m-220) (**M-219** / **M-220**).  
> **Honesty CI:** **TB-1264** Done (`scripts/ci/check_dapper_ddl_satellite_breakdown_signals_honesty.py`).

---

## Decision in one line

Breakdown is **compound operational pain** on the intentional Dapper + single-DDL + satellite dual-write stack — not “we want LINQ.” Climb the **strategy ladder** before any ORM-under-duress debate.

---

## Break when (compound — not single signal)

New feature PRs **routinely** need **≥3** of:

| Tax | Example |
| --- | --- |
| New satellite table | GoldenManifest phase-1 provenance |
| Dual-write + JSON compat | `*Json` + relational column |
| List projection audit | Hot-path omits fat `*Json` |
| DENY inventory update | Sealed evidence INSERT-only |
| InMemory parity | Test double drift |
| Backfill stage | DbUp + consolidated DDL sync |

**Not** a breakdown signal alone: developer preference for `Include()` / navigation properties.

---

## Leading indicators (watch)

| Signal | Where to measure |
| --- | --- |
| List/summary SQL duration & row size | App Insights dependencies |
| LOB / avg row on hot `*Json` | SQL DMVs / storage reports |
| Relational vs JSON drift | `HotPathRelationalQueryShapeTests` |
| Cutover readiness gaps | Phase-1 satellite coverage |
| RMW `SELECT *Json → patch → UPDATE` count | Code search / PR review |
| MigrateVerify / unified-schema failure rate | CI + deploy gates |
| Commit rebuild / hash CPU | H4/H5 perf notes |

---

## Strategy ladder (ordered)

| Step | Action | TB / pattern |
| --- | --- | --- |
| 1 | Typed list/summary projections | Done **TB-929** |
| 2 | Typed scalars on hot paths | **TB-931** |
| 3 | Query objects / named SQL modules | Hand-written SQL stays |
| 4 | Persistence-boundary read-model DTOs | No domain ORM |
| 5 | Optional Dapper mapper / source-gen helpers | SQL still explicit |
| 6 | DDL↔DTO codegen (if measured win) | IaC single-file DDL rule |
| 7 | Blob offload for fat payloads | **TB-932** (V2, measured) |
| 8 | Heavy ORM | **Only** after ladder + metrics + new ADR |

**Sealed evidence path** stays outside change-tracking ORM (ADR 0039 / 0045).

---

## Pins (do not debate away)

| Pin | Rule |
| --- | --- |
| Authority GoldenManifest | Buyer truth (**TB-1003**) |
| JSON columns | Compatibility / non–phase-1 — not primary query surface |
| Relational satellites | Query + provenance |
| List endpoints | Omit fat `*Json` on hot paths |
| DENY | INSERT-only for app role (**ADR 0039** / **0045**) |
| Catalog routing | Tenant isolation (**ADR 0037**) |

---

## Forbidden claims

| Too strong | Safe |
| --- | --- |
| “EF fixes tenant isolation / DENYs / perf” | ADR 0037 / 0039 — ladder first |
| Dual-write satellites = “halfway to ORM” | Intentional provenance pattern |
| JSON columns prove Dapper failed | Compat layer — measure LOB/list pain |
| “Adopt ORM now” without metrics | **TB-931** / ladder exhaustion |

---

## CI anchors for **TB-1264**

| Anchor | Purpose |
| --- | --- |
| This contract + buyer packet **M-219** / **M-220** | Required cite near ORM-under-duress language |
| `scripts/ci/check_dapper_ddl_satellite_breakdown_signals_honesty.py` | Fail EF-fixes-isolation/DENY / satellites=ORM / adopt-ORM-now overclaims |
| Code presence | `SqlGoldenManifestRepository`, `HotPathRelationalQueryShapes` |

---

## Explicit non-claims

- Does not implement **TB-931** / **TB-932**.
- Does not prescribe Entity Framework.
- Does not reopen Done **TB-929** / **TB-930**.

**Related:** **TB-931** · **TB-932** · **TB-1003** · **TB-1009** · **TB-1156** · GTM **M-219** / **M-220** · **TB-1264**.
