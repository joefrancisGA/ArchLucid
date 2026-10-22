> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# REST + CLI breaking-change compatibility (pilots that script)

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (**TB-1559**, 2026-08-10). GTM **M-288** / **M-289**. Honesty CI **TB-1560** / **M-288** **Done** (2026-08-14).

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#rest-cli-breaking-change-compatibility-m-289`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#rest-cli-breaking-change-compatibility-m-289) (GTM **M-289**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) (GTM **M-288**).

**Verdict (one line):** A **written** break/non-break + sunset policy exists (ADR 0006 / `API_CONTRACTS.md`); structural enforcement is **OpenAPI exact-snapshot drift + client/UI codegen sync**, **not** semantic backward-compat analysis or dual-version coexistence. Pilots script **`/v1` + `archlucid` CLI**; regenerating the snapshot can still ship a breaking change under the same major.

---

## 1. Policy (what we say)

| Rule | Source |
|------|--------|
| Major version in URL path (`/v1/...`) | ADR 0006; Asp.Versioning in `MvcExtensions` |
| Breaking → new major; additive OK on same major | ADR 0006 + `API_CONTRACTS.md` |
| Formal sunset ≥ **6 calendar months** + RFC 8594 `Sunset` when implemented | ADR 0006 |
| Contract of record | `GET /openapi/v1.json` (not Swashbuckle `/swagger/v1`) |

**Breaking (policy):** remove/rename required fields, change method/path for same op, semantic field breaks.  
**Non-breaking (policy):** optional fields, new endpoints, new enum values if clients ignore unknowns.

---

## 2. What is structural vs convention

| Mechanism | Structural? | Enforces |
|-----------|-------------|----------|
| OpenAPI v1 snapshot CI (`OpenApiContractSnapshotTests`) | Yes | Exact JSON equality — accidental drift |
| Buyer OpenAPI slice + forbidden-property tests | Yes | Audience leakage (TB-286/285) |
| NSwag + `openapi-typescript` in-sync asserts | Yes | Generated clients match snapshot |
| Starter path CI (`v1_integration_starter_contracts`) | Partial | Paths exist — not schema evolution |
| Asp.Versioning + `[ApiVersion]` metadata tests | Yes | Controllers are versioned |
| Semantic break detector (`oasdiff` / Spectral breaking) | **No** | Absent |
| Live `/v2` + dual-version runtime | **No** | Policy text only |
| `ApiDeprecation` Sunset headers | Config present | **Default off** |
| CLI command/flag/exit-code freeze | **No** | Docs + behavioral tests only |
| Pact / consumer-driven contracts | **No** | Absent |

**Safe pin:** Snapshot CI = **accidental-drift prevention**. Intentional regen can commit breaking `/v1` changes; human review is the break classifier. Method names implying “backward compatible” overclaim relative to `DeepEquals` equality.

---

## 3. What pilots script against

| Surface | First-class? |
|---------|--------------|
| `POST/GET …/v1/architecture/*` lifecycle (request → execute → commit) | Yes — handoff pack |
| `archlucid` CLI (`ArchLucid.Cli`) calling those routes | Yes — primary scripting CLI |
| Pilots/export/ROI / pre-commit simulate | Yes — documented automation |
| `/v1/internal/*`, `/v1/admin/*`, forensics | No — non-SDK |
| `Jobs.Cli` / `Backfill.Cli` | No — ops, not pilot contract |
| SCIM `/scim/v2/*` | Separate protocol — not product REST major |

---

## 4. Machines (do not conflate)

| Machine | Meaning |
|---------|---------|
| **A — Written policy** | ADR 0006 / API_CONTRACTS break + sunset intent |
| **B — Snapshot gate** | Merge blocked until OpenAPI JSON matches committed snapshot |
| **C — Regen under `/v1`** | Human can accept a breaking shape change without `/v2` |
| **D — Deprecation headers** | Optional middleware; off unless configured |
| **E — CLI** | HTTP client to `/v1`; no independent CLI semver freeze |

---

## 5. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “CI proves backward compatibility / semver for `/v1`” | CI proves OpenAPI snapshot equality |
| “Breaking changes always require `/v2` and are machine-enforced” | Should per policy; regen can break `/v1` |
| “Sunset / Deprecation headers always published” | Feature-flagged; default off |
| “Multiple REST majors coexist in production” | Only `1.0` / `/v1` shipped |
| “Buyer OpenAPI = full pilot surface” | Filtered; pilots use operator lifecycle routes |
| “CLI is versioned/stable independently of API” | CLI tracks `/v1` HTTP; no CLI compat gate |
| “k6 proves API contract stability” | Load metrics only |
| “Swashbuckle `/swagger/v1` is the contract” | Explicitly non-authoritative |
| “`API_V2_ROUTES.md` means v2 ships” | Doc is v1 canonical route taxonomy |

---

## 6. Related owners

| ID | Role |
|----|------|
| Done **TB-285** / **TB-286** | Buyer OpenAPI audience + forbidden props |
| Done **TB-318** / **TB-208** / **TB-209** | Automation handoff + CLI packaging |
| Open **TB-1034** / **M-184** | Strangler / `…/result` sunset (adjacent lifecycle) — do not conflate with REST major versioning |
| [`OPENAPI_CONTRACT_DRIFT.md`](OPENAPI_CONTRACT_DRIFT.md) | Snapshot refresh workflow |
| [`API_CONTRACTS.md`](API_CONTRACTS.md) | Written break/non-break policy |
| Done **TB-1559** / **M-288** | This compatibility claim map |
| Done **TB-1560** / **M-288** | Honesty CI (`check_rest_cli_breaking_change_compat_honesty.py`) |

## 8. CI anchors for **TB-1560**

- Guard: `scripts/ci/check_rest_cli_breaking_change_compat_honesty.py` (+ unit tests; wired in `run_buyer_surface_strict_guards.py`).
- Vitest inventory: `archlucid-ui/src/lib/rest-cli-breaking-change-compat-honesty.test.ts`.
- Code anchors: `OpenApiContractSnapshotTests`, `API_CONTRACTS.md`, `OPENAPI_CONTRACT_DRIFT.md`, `ApiDeprecationHeadersMiddleware`.

---

## 7. Optional follow-ons (not required to close honesty pin)

1. Add `oasdiff` (or equivalent) breaking-change check on OpenAPI diffs.  
2. Enable Sunset headers in prod when a route family is formally deprecated.  
3. CLI surface snapshot (commands/flags/exit codes) for pilot-critical verbs.  
4. Rename or retitle `API_V2_ROUTES.md` to reduce “v2 shipped” confusion.
