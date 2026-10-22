> **Scope:** Engineering-owned register of **architecture and design questions** for strong-model review (Opus, Sonnet, or equivalent). Living document — not buyer-facing. Complements ADRs (decisions), [`TECH_BACKLOG.md`](TECH_BACKLOG.md) (engineering work), and [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) (owner product/commercial decisions).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Strong-model architecture & design questions (SAQ)

## Why this exists

First-principles questions asked of a **strong reasoning model** have repeatedly surfaced load-bearing assumptions, pre-ship risks, and ADR-worthy commitments before they became expensive rewrites. This register tracks those questions like any other backlog item: **open → reviewed → resolved** (ADR, TB, shipped fix, owner decision, or explicit defer).

**Composer** (fast implementation agent) owns execution after a question is scoped or resolved. **Opus / Sonnet** own the hard review passes.

## When to use a strong model (not Composer)

Ask Opus or Sonnet when the question is:

- **Load-bearing** — wrong answer forces rewrite, not refactor
- **Cross-cutting** — tenancy, durability, claims/evidence, economics, scope model
- **Pre-ship or pre-claim** — affects what we may honestly sell or operate
- **ADR-shaped** — alternatives exist; reversal cost is high

Use Composer to implement after the question is resolved or scoped to a **TB-###** item.

## Workflow

1. **Add** a row below (`Status: Open`, assign **P0–P2** priority).
2. **Ask** using the prompt template; attach relevant ADRs, topology docs, and assessment excerpts.
3. **Record outcome** in `Resolution` — one of:
   - **ADR** — link new or existing ADR
   - **TB** — link engineering backlog item
   - **Acted** — shipped without ADR (small, bounded)
   - **Owner** — move detail to `PENDING_QUESTIONS.md` if commercial/ops input required
   - **Defer** — V1.1+ with explicit reassessment trigger
4. **Close** the SAQ row when resolution is merged; keep the question text for history.
5. Optional: append a one-paragraph **session note** under [Session notes](#session-notes) (date, model, gist).

**RC gate (TB-318):** Open **P0** SAQs are RC blockers unless explicitly waived in release notes. Open **P1** SAQs require documented owner acceptance before strict RC signoff.

## Prompt template (copy into Opus / Sonnet session)

```text
You are reviewing ArchLucid architecture for V1 controlled-pilot release.

Context to read first (if present in repo):
- docs/architecture/adrs/README.md
- docs/library/TENANT_DATABASE_TOPOLOGY.md
- docs/library/DATA_CONSISTENCY_MATRIX.md
- docs/library/ARCHITECTURE_INVARIANTS.md
- docs/library/ARCHITECTURE_CONSTRAINTS.md
- Relevant ADRs cited in the question below

Question:
[SAQ-NNN: your question here]

Answer format:
1. Load-bearing? (yes/no — would being wrong force a costly rewrite?)
2. Current design assumption (what the code/docs already commit to)
3. If wrong: blast radius and earliest signal
4. Recommendation: Act now | ADR to lock | Defer — with concrete next step (TB-### if engineering)
5. Do NOT suggest scope creep unless the question requires it
6. Separate architecture risk from evidence/GTM gaps (Assessment-Scope-V1_1)
```

---

## Register

| SAQ | Pri | Status | Question | Reviewed | Resolution |
| --- | --- | --- | --- | --- | --- |
| **SAQ-001** | — | **Resolved** | What are the load-bearing assumptions in this design that, if wrong, would force a costly rewrite later? | 2026-06-07 | Seven assumptions ranked. **ADR:** [0048](../architecture/adrs/0048-socratic-intake-mutable-draft-lifecycle.md), [0049](../architecture/adrs/0049-actor-descriptor-model.md), [0050](../architecture/adrs/0050-feasibility-classification-transparency-trail.md). **Locked:** [0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md), [0038](../architecture/adrs/0038-run-durability-multi-store-outbox-production-secrets.md), [0020](../architecture/adrs/0020-azure-primary-platform-permanent.md). |
| **SAQ-002** | P1 | **Resolved** | Should we mitigate the mirror `dbo.Tenants` row inconsistency before ship, or defer DDL de-normalization? | 2026-06-07 | **Acted:** column authority matrix + CI guard + Tier/Entra dual-write ([TB-313](TECH_BACKLOG.md#tb-313--tenant-directory-mirror-column-authority--sonnet-saq-register)). **Defer:** FK/mirror removal (topology doc alternatives). |
| **SAQ-003** | P1 | **Resolved** | When ADR 0048 tripwires fire (>500 catalogs/pool or 10× free:paid ratio), is shared-catalog + RLS the only reversal path, or are intermediate economics mitigations (tier gating, catalog hibernation, trial TTL hard purge) sufficient to defer that reversal? | 2026-06-15 | **Owner decision:** Shared catalog reversal and intermediate mitigations are explicitly rejected ("NEVER, EVER"). No action required on shared catalog or mitigations. |
| **SAQ-004** | P1 | **Resolved** | What `[TenantScopeExempt]` growth rate should block release vs trigger analyzer extension? Is there a safe exemption budget per release? | 2026-06-15 | **Owner decision:** Tripwire discussion is explicitly pushed out permanently. No strict budget or tripwire will be enforced for `[TenantScopeExempt]` usages. **TB-315** closed. |
| **SAQ-005** | P2 | **Resolved** | Inventory all workflows: does any product path **require** atomic writes across system catalog + tenant catalog (true 2PC)? If none, document as invariant. | 2026-06-07 | **No true 2PC exists, and no path requires it.** Core product paths (runs, UoW, outbox, metering) are single-catalog. Two paths dual-write without atomicity: (1) `DapperTenantRepository` tenant lifecycle mirroring (suspend, erasure, legal hold) — tolerated via column-authority matrix + discipline; (2) `SqlTenantSqlCatalogProvisioner` provisioning saga — explicit sequential with logged "manual cleanup" on partial failure. **Invariant documented:** [`DATA_CONSISTENCY_MATRIX.md`](DATA_CONSISTENCY_MATRIX.md) cross-catalog section. **TB-316 Done.** |
| **SAQ-006** | P1 | **Resolved** | For V1 regulated pilots, is workspace/project IDOR **within** a tenant catalog an accepted residual risk under ADR 0037, or do we need an explicit buyer-facing limitation + detection? | 2026-06-14 | **Acted:** V1 posture doc + IDOR regression matrix on high-value routes — [`V1_WORKSPACE_PROJECT_AUTHORIZATION_POSTURE.md`](../security/V1_WORKSPACE_PROJECT_AUTHORIZATION_POSTURE.md). Workspace/project are organizational scope, not paying-client isolation; residual non-matrix routes documented. **TB-317** tracks matrix expansion. |
| **SAQ-007** | P0 | **Resolved** | What is the minimum **real-mode** evidence set to advance claim stage beyond controlled-pilot (G4/G5), and who signs it? | 2026-06-14 | **Owner decision:** Controlled pilot OK without broad real-mode proof; Stage 1 requires ≥3 real runs + **founder signoff**. Reference AOAI: existing `ARCHLUCID_CI_REAL_AOAI_*` secrets. **Doc:** [`SAQ_P0_RC_RELEASE_DECISIONS.md`](SAQ_P0_RC_RELEASE_DECISIONS.md). |
| **SAQ-008** | P0 | **Resolved** | If pilot telemetry shows systematic simulator/live divergence on **schema-valid** outputs, do we narrow claims, add retry, or block release — and on what thresholds? | 2026-06-14 | **Act now:** WARN 5–15%, HOLD >15% golden cohort; ≥2 consecutive faithfulness HOLD blocks strict RC. **Doc:** [`SAQ_P0_RC_RELEASE_DECISIONS.md`](SAQ_P0_RC_RELEASE_DECISIONS.md); ADR [0050](../architecture/adrs/0050-feasibility-classification-transparency-trail.md). |
| **SAQ-009** | P1 | **Resolved** | Is warm standby catalog pool sizing (**TB-018**) sufficient for expected signup burst, or does signup p95 become the first economics failure mode before catalog-count tripwires? | 2026-06-15 | **Owner decision:** Warm standby pool sizing is sufficient. ADR 0054 created. |
| **SAQ-010** | P1 | **Resolved** | Which P0/P1 architecture invariants are still convention-only (`ARCHITECTURE_INVARIANTS.md`) and must be enforced before GA vs honestly deferred to V1.1? | 2026-06-14 | **Act now:** P0 enforced or waived before GA; P1 may defer with documented residual. **Doc:** [`SAQ_P0_RC_RELEASE_DECISIONS.md`](SAQ_P0_RC_RELEASE_DECISIONS.md); `report_architecture_invariant_enforcement.py`. |
| **SAQ-011** | P0 | **Resolved** | Can any sponsor export, UI surface, or API response today imply production-grade AI or availability without execution mode + evidence basis labels? If yes, where — and is that an architecture fix or a claims/doc fix? | 2026-06-14 | **Act now:** Audit complete — [`CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit`](../go-to-market/CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit) (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias). Claims/doc fix unless DTO field missing. **Doc:** [`SAQ_P0_RC_RELEASE_DECISIONS.md`](SAQ_P0_RC_RELEASE_DECISIONS.md). |
| **SAQ-012** | P2 | **Resolved** | Does cognitive load (many surfaces before first value) create **misconfiguration** risks that bypass tenancy/durability guards — e.g. wrong catalog mode, mixed simulator/live in one tenant workflow? | 2026-06-17 | **Acted:** misconfiguration matrix + pre-commit nav gate + sponsor execution-mode PDF block — [`PILOT_MISCONFIGURATION_GUARDS.md`](../runbooks/PILOT_MISCONFIGURATION_GUARDS.md). Residual: deep-link discipline only. |
| **SAQ-013** | P1 | **Resolved** | Should ArchLucid add a **pre-run Socratic intake loop** that elicits architecture intent from naive users (free text → clarifying questions → convergent draft → `ArchitectureRequest`)? Today every LLM surface presupposes a run/manifest: `AskService` throws without a committed manifest, and `CreateRunAsync` is single-shot. Supporting this requires three **fundamental** additions: (a) a **pre-run, manifest-free reasoning surface**; (b) a **mutable draft-request lifecycle** (`draft → submitted → run`) distinct from today's submit-once-then-frozen `ArchitectureRequest`; (c) an **LLM semantic admission / domain-fit gate** that can *reject or redirect* non-architecture input (current validator only checks `Description` length ≥ 10). Is this **V1** or **V1.1**? Does the admission gate inherit **SAQ-008** (sim/live divergence) and **SAQ-011** (claim labeling) evidence discipline, and must intake fail-open to the manual wizard under budget/LLM outage? | 2026-06-15 | **Owner decision:** Socratic loop is an absolute V1 requirement. **ADR 0055** created. Implementation is a V1 release blocker. |

---

## Session notes

Brief record of strong-model review passes (optional; keep SAQ table as source of truth for status).

| Date | Model | SAQ(s) | Gist |
| --- | --- | --- | --- |
| 2026-06-07 | Sonnet | SAQ-001, SAQ-002 | Load-bearing assumptions ranked; mirror row mitigated via column authority + dual-write; ADR 0048–0050 filed. |
| 2026-06-14 | GPT-5.5 | SAQ-007, SAQ-008, SAQ-010, SAQ-011 | P0 SAQ RC closure: real-mode evidence source = existing CI AOAI secrets; founder signoff for Stage 0→1; divergence HOLD thresholds; invariant enforcement + claim label audit. |

---

## Adding a new question

1. Assign the next **SAQ-###** (never reuse IDs).
2. Add a row with `Status: Open` and **Pri** (P0 = RC blocker candidate, P1 = pre-RC acceptance, P2 = post-pilot / V1.1).
3. If engineering work is obvious, create **TB-###** in [`TECH_BACKLOG.md`](TECH_BACKLOG.md) and link both ways.
4. After review, update `Reviewed` date and `Resolution`; set `Status: Resolved` or `Deferred`.
5. Seed from assessments: each new `latest_*.md` should yield at least one net-new SAQ or explicit “no new architecture question” note in session notes.

## Related

- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) — **TB-313+** Sonnet/SAQ cluster
- [`TECH_BACKLOG_OPEN.md`](TECH_BACKLOG_OPEN.md) — open SAQ-linked TB items
- [`docs/architecture/adrs/README.md`](../architecture/adrs/README.md)
- [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) — owner decisions
- Rolling assessments — `docs/assessments/latest_*.md` (local working copies; gitignored)
