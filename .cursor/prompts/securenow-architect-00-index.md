<!-- SecureNow architect Composer prompts — paste one prompt per session.
     Origin: 2026-09-10 owner ask: implement agreed automated Azure security-architect
     capabilities (paths, provenance, ranking, advisory remediation) without a
     mega-graph, live Azure mutation, or overclaimed data-flow.
     Do not implement from this index. -->

# SecureNow architect — Composer prompt set (SA-01–SA-22)

SecureNow reasons `configuration → capability → reachability → consequence` over **proven** Azure inventory. It is not a bigger scanner and not an apply engine.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/securenow-architect-NN-*.md` file per Composer / Cloud Agent session.

Copy-paste docs index: [`docs/architecture/SECURENOW_ARCHITECT_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_ARCHITECT_COMPOSER_PROMPTS.md).

Contract: [`docs/library/SECURENOW_ARCHITECT_PLANE.md`](../../docs/library/SECURENOW_ARCHITECT_PLANE.md). If a prompt and the plane conflict, **the plane wins**. Observation spine: [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../docs/library/INFRA_EVIDENCE_PLANE.md).

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | No first-class path record; findings cannot cite hops | **SA-01** | `SecurityEvidencePath`, hops, `PathConfidenceBand`, provenance required |
| 2 | Graph still heuristic CONTAINS/PROTECTS; RBAC/network unlabeled | **SA-02** | Live-inventory security edges with ProvenanceKind |
| 3 | No transitive privilege over snapshot RBAC + MI | **SA-03** | Privilege-path engine → operational finding citing PathId |
| 4 | Path exists only in engine memory | **SA-04** | Path inspector API (GET hops + weakest-link reason) |
| 5 | Public exposure ranked as a CIS miss, not a path | **SA-05** | Intended reachability engine; unverified ≠ allow |
| 6 | Findings processed equally; no toxic combinations | **SA-06** | Compose public × identity × egress into one path kind |
| 7 | Temptation to say “exfiltrates PHI” from ARM | **SA-07** | Capability-to-flow; “may access”; sensitivity is HumanAssertion |
| 8 | Shared MI / root policy treated like a single VM | **SA-08** | Shared-control blast-radius engine |
| 9 | Multiplicative magic score or IE-15-only resource ranking | **SA-09** | Independent path-rank dimensions; Unknown must not zero |
| 10 | Fix 150 findings instead of one choke point | **SA-10** | Cut points weighted by operational cost class |
| 11 | Metrics celebrate tickets closed | **SA-11** | Architecture-outcome metrics on paths |
| 12 | IaC/diagram/history not joined to the path | **SA-12** | Four-reality drift on path-relevant controls |
| 13 | Full-estate recompute every snapshot | **SA-13** | Incremental neighborhood invalidation via IE-06 |
| 14 | Remediation still “HIGH: public storage” | **SA-14** | Path-aware advisory narrative + verify queries |
| 15 | No owners / approvals on path work | **SA-15** | Organizational routing fields; empty ≠ invented |
| 16 | Graph explorer as the product | **SA-16** | Findings queue + path inspect workbench (SecureNow) |
| 17 | LLM minting topology or ExactMatch | **SA-17** | Constrained AI explanation over cited PathId |
| 18 | PHI/criticality missing or immortal | **SA-18** | Human asset assertions with required expiry |
| 19 | GitHub admin → federated identity invisible | **SA-19** | Optional CI federated-credential adapter |
| 20 | Entra group transits missing; risk of Global Reader | **SA-20** | Optional least-privilege Graph adapter |
| 21 | Copy says 82% or “data flowed” | **SA-21** | Honesty copy: ordinal bands + architect sentence template |
| 22 | Session starts apply / mega-graph / IFindingEngine | **SA-22** | Written hold — not implementation |

## Run order

**SA-01** first (types). **SA-02** after 01 (edges). **SA-03** after 02. **SA-04** after 03 (or same wave once paths persist). **SA-05** after 02; **SA-06** after 03+05. **SA-07** after 03+05+18 preferred (18 may lag; then consequence stays Unknown). **SA-08** after 02. **SA-09** after at least one path kind. **SA-10** after 09. **SA-11** after 09. **SA-12** after 03 and IE-06. **SA-13** after 03 and IE-06. **SA-14** after 03 and IE-13. **SA-15** after 01. **SA-16** after 04. **SA-17** after 04. **SA-18** parallel after 01. **SA-19/SA-20** after 03; fail soft. **SA-21** after 16. **SA-22** is not implementation.

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SA-01** | First | IE-01/IE-04/IE-09 types exist |
| **SA-02** | After 01 | IE-03 materialize |
| **SA-03** | After 02 | Path tables |
| **SA-04** | After 03 | Persisted paths |
| **SA-05** | After 02 | Network snapshot rows |
| **SA-06** | After 03+05 | Both path kinds |
| **SA-07** | After 03+05 | Assertions optional |
| **SA-08** | After 02 | Shared identity/policy rows |
| **SA-09** | After 03 | Paths to rank |
| **SA-10** | After 09 | Ranked paths |
| **SA-11** | After 09 | Rank + prior snapshot |
| **SA-12** | After 03 | IE-06; IE-05/IE-19 if present |
| **SA-13** | After 03 | IE-06 consumer hook |
| **SA-14** | After 03 | IE-10–IE-13 |
| **SA-15** | After 01 | Path or finding row |
| **SA-16** | After 04 | Inspector API |
| **SA-17** | After 04 | Path GET |
| **SA-18** | After 01 | Parallel with engines |
| **SA-19** | After 03 | Privilege engine extension |
| **SA-20** | After 03 | Same |
| **SA-21** | After 16 | UI copy |
| **SA-22** | Hold | — |

## Do not implement from this set

| Item | Why |
|------|-----|
| Second Azure / ARC-AMPE collector | Plane + IE invariant |
| `IFindingEngine` / DX-77 / coverage engines | [`HOLD_NO_COVERAGE_ENGINES.md`](../../docs/quality/HOLD_NO_COVERAGE_ENGINES.md) |
| Findings as traversable graph nodes | Circular engines |
| `terraform apply` / ARM writes / write roles | IE plane §2 |
| Observed exfiltration from control plane | Capability-to-flow only |
| Per-pod graph, SIEM stream, full CMDB | V1 out of scope |
| Confidence percentages | False precision |
| Multiplicative risk as product of record | Unknown zeros real paths |
| AWS/GCP path engines | SecureNow Azure-first this set |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |
| Desktop review tab collapse | workspace rule |

## Product vs company (every prompt)

- **SecureNow** = Security product in the Security shell.
- **ArchLucid** = Architecture product + legal/company.
- Code identifiers stay `ArchLucid`. Env stays `ARCHLUCID_*`.

## Global constraints (every prompt)

- Read [`docs/library/SECURENOW_ARCHITECT_PLANE.md`](../../docs/library/SECURENOW_ARCHITECT_PLANE.md) first.
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing tracked files (Linux Cloud: `pwsh` from `$HOME/.local/bin`).
- Commit only on the named feature branch.
- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first in method. Check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests.**
- ADR 0037: `TenantId` on every new table. Isolation test modeled on `SqlAzureExtractorPackageRepositoryScopeIsolationSqlIntegrationTests`.
- DbUp next unused number **and** `ArchLucid.sql` **and** `Migrations/Rollback/Rnnn_*.sql`.
- HTTP: OpenAPI snapshot + route registry; mutating routes in the audit coverage matrix.
- Audit events in `ArchLucid.Core/Audit/AuditEventTypes.InfraEvidence.cs` (or a sibling file). Do not collide names.
- **AI explains evidence; AI is not the evidence.**
- UI: Carbon, `EnterpriseTable`, sentence case, **TB-2005**, **TB-645**. No desktop tab collapse. Operate disclosure for diagnostics.
- One scoped compile; one retry on exit 1. No new NuGet unless the prompt says so.
- Stage only files the prompt names. **No `git add -A`.**
- Do not start G-REAL-06 live spend, SOC 2 CPA, or third-party pen test.

## After each prompt

Summarize: files changed, tests run, which path kind or API landed, residual InsufficientEvidence cases, Architecture review `IFindingEngine` stream unchanged, and whether the no-apply hold still holds.
