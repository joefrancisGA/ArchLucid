> **Scope:** Contributor-reference — one-page architecture invariants for V1 feature and proof work.

# ArchLucid V1 — architecture invariants (one page)

**Audience:** engineers adding features, agents, or proof artifacts.

**Purpose:** Gate new work against current boundaries. This is not a full architecture doc — see [BUILD.md](BUILD.md) and [V1_SCOPE.md](V1_SCOPE.md).

---

## Layer boundaries (do not collapse)

| Layer | Owns | Must not own |
| --- | --- | --- |
| **API** | HTTP contracts, authZ, Problem Details, OpenAPI snapshot | Business orchestration, SQL, LLM prompts |
| **Application** | Use cases, proof/report builders, governance orchestration | Raw HTTP, UI state |
| **Persistence** | Dapper access, tenant scoping, migrations via DbUp | Agent runtime, retrieval scoring |
| **AgentRuntime** | Execution mode, schema validation, quality gates | Sponsor PDF layout |
| **UI** | Operator/buyer surfaces, static proof snapshots | Authoritative proof verdict (CLI/scripts) |

---

## Invariants

1. **Committed review is the unit of truth** — sponsor packets, ROI basis, and proof chains reference a finalized manifest on a tenant-scoped run, not draft chat.
2. **Simulator vs real LLM is always disclosed** — PilotStrict sponsor wording requires attested real-mode evidence; never blur simulator and buyer outcome.
3. **Evidence → finding → manifest → artifact → audit** — new claims must trace this chain or be labeled estimate/deferred/manual review.
4. **Single SQL DDL file per database** — schema changes go through the consolidated migration path ([SQL_SCRIPTS.md](SQL_SCRIPTS.md)).
5. **Route/tier/policy/nav registry parity** — UI routes and API tiers that change in a PR must pass `assert_route_tier_policy_nav.py` before sponsor send.
6. **No silent procurement assurance** — SOC 2 CPA, pen-test publication, and marketplace checkout stay `(B)`/deferred; use [ASSURANCE_STATUS_CANONICAL.md](../go-to-market/ASSURANCE_STATUS_CANONICAL.md) wording.
7. **Proof pipelines are read-only** — `collect-first-pilot-proof.ps1` does not mutate tenants, Terraform, or policy packs.
8. **Azure-native default** — identity, storage, and networking assumptions target Entra ID and Azure services unless a runbook documents an explicit deviation.

---

## Anti-patterns (reject in V1)

- Chat-only answers without manifest/evidence anchors for sponsor-facing copy.
- Projected dollar ROI without `projectedDollarClaimsSponsorSafe` and baseline field basis.
- Second operational checklist competing with [FIRST_PILOT_OPERATOR_PATH.md](../runbooks/FIRST_PILOT_OPERATOR_PATH.md).
- Load-test or multi-region claims without fresh measured artifacts in `scale-envelope-evidence.json`.
- Inline imports, cross-layer circular dependencies, or ORM introduction without ADR-level justification.

---

## Proof artifacts that enforce integrity

| Artifact | Enforces |
| --- | --- |
| `go-no-go-summary.md` | PASS/WARN/BLOCK findings + support next step |
| `first-pilot-command-center.md` | Single NEXT ACTION |
| `environment-reliability-rollup.md` | Coarse reliability HOLD aggregation |
| `committed-review-trace-chain-summary.md` | Evidence chain completeness |
| `route-tier-policy-nav-parity` finding | Registry drift |

Regenerate navigation index: `python scripts/ci/build_v1_navigation_index.py`.
