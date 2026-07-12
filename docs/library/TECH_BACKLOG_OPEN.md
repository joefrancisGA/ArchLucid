> **Scope:** Contributor-reference — verified **open** items extracted from the main tech backlog; not a buyer or operator document.

# Tech backlog — verified open items

> **Updated:** 2026-07-12 (added open **TB-754–TB-759** cold-start free-cost cluster; full regen still tracked by **TB-673**). **Source of truth:** [`TECH_BACKLOG.md`](TECH_BACKLOG.md). **Done detail archive:** [`docs/archive/TECH_BACKLOG_DONE_ARCHIVE.md`](../archive/TECH_BACKLOG_DONE_ARCHIVE.md). **Sonnet questions:** [`SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md`](SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md).

## Recently closed (do not re-open)

| Cluster | IDs |
| --- | --- |
| Persona UX audit + deploy (batch A) | **TB-642** – **TB-657** (Done detail archived 2026-07-06; **TB-655**, **TB-656** remain open) |
| Review Package hierarchy (batch B) | **TB-617** – **TB-620** (Done detail archived 2026-07-06; **TB-621** remains open) |
| Cross-tenant isolation test matrix | **TB-078** |
| Architecture.Tests gap closure | **TB-030** |
| Backfill / jobs operational hardening | **TB-085** – **TB-090** |
| Tenancy defense-in-depth | **TB-076**, **TB-077** |
| In-app docs | **TB-143** – **TB-148** |
| Data consistency KPIs | **TB-149** – **TB-155** |
| Local dev diagnostics | **TB-156** – **TB-157** |
| Run detail operator fidelity | **TB-109** – **TB-113** (incl. **TB-110** tool forensics) |
| Starter proof packs | **TB-170** – **TB-174** (chooser, metadata, CI validation, dry-run, golden walkthrough) |
| Policy pack manifests | **TB-175** – **TB-176** (packManifest, CI validation, dry-run index) |
| Commercial / audit parity | **TB-121** – **TB-128** (route parity, governance summary, freshness, audit matrix, buyer-safe audit, catalog, tests, triage one-pager) |
| Commercial closeout | **TB-129** – **TB-134** (quote-to-proof readiness, quote aging export, closeout consistency, tier fit, offer pack, overclaim guard) |
| Pilot acceptance automation | **TB-158** (threshold doc + `report_pilot_acceptance_thresholds.py` + first-pilot proof artifacts) |


## Open items (auto-generated from summary table)

_Regenerated 2026-07-07. 36 open rows (+ **TB-754–TB-759** appended 2026-07-12; full regen still **TB-673**)._

| ID | Title | Cluster |
| --- | --- | --- |
| TB-754 | Verify CD post-deploy retry repo vars | Deployability — cold start, zero Azure compute increase |
| TB-755 | Enable CD canary + bake (staging/production) | Deployability — hide revision cold start |
| TB-756 | Avoid no-op Container App updates | Deployability — reduce revision thrash |
| TB-757 | UI proxy / client warm-up tolerance | Adoption friction — 502/503 retry before toast |
| TB-758 | Cheap `SMOKE_SYNTHETIC_PATH` after `/version` | Deployability — post-deploy warm path |
| TB-759 | Cold-start measurement runbook | Performance — evidence before paid levers |
| TB-9 | Architecture invariant program ? doc + ADR 0035 finalize | Engineering governance ? single catalog IDs `INV-*`, proposed ADR acceptance, links from index / Cursor rule |
| TB-141 | Near-term GTM backlog: real pilot proof packet cohort | GTM proof ? owner-selected scenarios, approved data boundaries, and buyer-safe proof packets for Azure cost / orphan / governance review and adjacent starter cohorts |
| TB-142 | Near-term GTM backlog: market-facing demo asset production | GTM proof ? approved screenshots/video/copy and evidence-labeling rules for channel-specific demo assets |
| TB-161 | Design partner / pilot recruiting pipeline | GTM execution ? target accounts, qualification criteria, founder-led outreach, pilot acceptance terms, and proof-capture permission path |
| TB-162 | Support and pilot operating model | Operations ? support hours, escalation path, response targets, incident communications, owner availability, and white-glove vs self-serve pilot posture |
| TB-163 | Transactable procurement path | Commercial conversion ? invoice/services SOW/private offer/Stripe/Marketplace decision tree, payment terms, legal/tax readiness, and claim boundaries |
| TB-164 | V1.1 backlog: first named public reference customer | GTM proof ? customer permission, logo/case-study approval, reference-call terms, and claim update process |
| TB-165 | Assessment score consistency guard | Documentation quality ? keep weighted tables, per-quality sections, and headline score synchronized after rescores |
| TB-182 | `Write-AiReadinessPosture.ps1` ? automate production of `ai-readiness-posture.json` from evidence artifacts | AI/Agent Readiness P1 ? every pilot delivery currently requires manual JSON fill; schema stable |
| TB-398 | Full enterprise ITSM connector ? OAuth flows, field-mapping UI, custom workflow mapping, bidirectional status sync, tenant connector onboarding wizard | Interoperability P3 ? **V2**; explicitly out of V1/V1.1 scope unless owner promotes |
| TB-419 | Tenant-isolation negative-test default operational artifact bundle — auto-write JSON + Markdown under `artifacts/tenant-isolation-negative-test/{runId | offline-fixture}/` when repo root resolves; `--no-write-artifacts` for stdout/API-only runs |
| TB-420 | Citation-integrity default operational artifact bundle — auto-write JSON + Markdown under `artifacts/citation-integrity/{offline-fixture | live-api}/` when repo root resolves; `--no-write-artifacts` for stdout/API-only runs |
| TB-421 | Buyer-proof evidence ledger default operational artifact bundle — auto-write JSON + Markdown under `artifacts/buyer-proof-evidence-ledger/{runId | proof-pack}/` when repo root resolves; `--no-write-artifacts` for stdout-only runs |
| TB-425 | Pilot readiness release-train bundle — `archlucid pilot readiness-bundle` orchestrates TB-418—TB-424 child bundles in-process; aggregate JSON + Markdown under `artifacts/pilot-readiness-bundle/{runId | offline-fixture}/`; PASS/FAIL/UNKNOWN/WARN rollup; `--no-write-artifacts` for stdout-only runs |
| TB-426 | ITSM pull-forward gate default operational artifact bundle — auto-write JSON + Markdown under `artifacts/itsm-pull-forward-gate/{ledger-name | live-api}/` when repo root resolves; `--no-write-artifacts` for stdout-only runs |
| TB-621 | Review Package detail page spacing/affordance pass and terminology-surface extension — apply `OPERATOR_TYPOGRAPHY`/spacing tokens per `.cursor/rules/UI-Enterprise-Design-Standard.mdc`; residual badge/link/button affordance sweep; extend `review-terminology-surfaces.ts`; see `## TB-621` below | Adoption friction P3 — **V1**; depends on **TB-617**, **TB-618**, **TB-620**; found during a principal-architect Review Package detail page hierarchy audit 2026-07-05 |
| TB-635 | `ArchLucid.Api` Cobertura triage inventory — classify every below-95% class in `docs/COVERAGE_GAP_ANALYSIS.md` § ArchLucid.Api into pure-DTO / integration-covered (measurement gap) / small-logic unit-test / genuinely untested; cross-reference `ArchLucid.Api.Tests` by class and `Category` trait; publish inventory before exclusions or new tests; see `## TB-635` below | Testability P2 — **V1**; found during CI #2516 `ArchLucid.Api` coverage analysis 2026-07-05 |
| TB-636 | Batch `[ExcludeFromCodeCoverage]` for `ArchLucid.Api` pure request/response DTOs — apply `docs/library/coverage-exclusions.md` Category 2 to auto-property-only types confirmed by **TB-635**; update exclusion table; do **not** exclude controllers, services, or field mappers with logic; see `## TB-636` below | Testability P3 — **V1**; depends on **TB-635**; found during CI #2516 `ArchLucid.Api` coverage analysis 2026-07-05 |
| TB-637 | Unit tests for `ArchLucid.Api` small logic surfaces — `[Theory]`/mapper tests for auth issuer patterns, payload/response mappers, and validators triaged in **TB-635** (e.g. `ExternalIdIssuerPatterns`, `ConsultingDocxJobPayloadMapper`, `EvolutionCandidateChangeSetResponseMapper`); use non-Integration `ArchLucid.Api.Tests` so Coverlet on `coverage.runsettings` shards collects them; see `## TB-637` below | Testability P2 — **V1**; depends on **TB-635**; found during CI #2516 `ArchLucid.Api` coverage analysis 2026-07-05 |
| TB-655 | Terraform root consolidation — collapse 15+ roots into `foundation` / `platform` / `app` modules with state-migration plan; retire conflicting `apply-saas.ps1` vs `provision-landing-zone.ps1` orderings; see `## TB-655` below | Deployability P2 — **V1**; depends on **TB-654** schema; found during setup/deployment complexity review 2026-07-05 |
| TB-659 | Onboarding doc consolidation — one canonical setup path per persona (dev, platform operator, enterprise tenant); archive superseded runbooks with redirect notes under `docs/archive/`; see `## TB-659` below | Maintainability P3 — **V1**; extends **FIRST_30_MINUTES.md** discipline; found during setup/deployment complexity review 2026-07-05 |
| TB-661 | Reference-architecture exemplar curation runbook — checklist for constraints, topology diversity, PII/customer-name bans, fingerprint coverage, and review sign-off before merge; see `## TB-661` below | Maintainability P2 — **V1**; complements **TB-660** |
| TB-664 | Prior-manifest corpus quality guidance for operators — when accepted runs produce useful Ask/prior-decision chunks vs noise; commit-time doc + optional UI hint; see `## TB-664` below | Stickiness P2 — **V1**; **RAG-V1-002** already indexes on commit |
| TB-670 | Migrate existing hand-rolled tab UIs onto shared `Tabs` primitive — Settings roles, Help shell/panel, deliverables artifact tabs, Alerts/Digests/Advisory hubs; add arrow-key support and `tabpanel` linkage everywhere; see `## TB-670` below | Adoption friction P2 — **V1**; depends on **TB-665**; found during tab-candidate UX assessment 2026-07-06 |
| TB-671 | Decision register Cards/Timeline view switcher — segmented control with machine-readable selected state (`aria-pressed` or radiogroup); currently zero ARIA state; see `## TB-671` below | Adoption friction P2 — **V1**; independent of **TB-665**; found during tab-candidate UX assessment 2026-07-06 |
| TB-672 | Ask conversation thread list selection semantics — `aria-current` (or listbox) on `AskThreadHistoryPanel` so assistive tech announces the active conversation; not tabs (dynamic unbounded set); see `## TB-672` below | Adoption friction P2 — **V1**; independent of **TB-665**; found during tab-candidate UX assessment 2026-07-06 |
| TB-673 | TECH_BACKLOG done-item archive hygiene — move closed `## TB-xxx` bodies to `docs/archive/TECH_BACKLOG_DONE_ARCHIVE.md`; regenerate `TECH_BACKLOG_OPEN.md`; batched script + link stubs in main file; see `## TB-673` below | Maintainability P2 — **V1**; found during backlog readability review 2026-07-06 |
| TB-674 | Rename Getting started → First review guide — page title, nav label, tooltip, home continue-setup CTA, and aligned help cross-refs; see `## TB-674` below | Adoption friction P2 — **V1**; supersedes interim **TB-434** label; found during First review guide redundancy audit 2026-07-06 |
| TB-675 | Derive Core Pilot checklist completion from tenant/review lifecycle state — replace manual localStorage checkboxes; single highlighted next action; see `## TB-675` below | Adoption friction P1 — **V1**; found during First review guide redundancy audit 2026-07-06 |
| TB-676 | Remove duplicate cloud inventory evidence step from Finish setup wizard — keep only Core Pilot walkthrough step 4; see `## TB-676` below | Adoption friction P3 — **V1**; found during First review guide redundancy audit 2026-07-06 |
| TB-677 | Customer-safe platform health link on onboarding workspace setup — **Done** (2026-07-06) | Adoption friction P1 — **V1** |
| TB-678 | Role-gate onboarding workspace setup block on `principalAdmin` — non-admins see admin-delegation one-liner only; see `## TB-678` below | Adoption friction P2 — **V1**; found during First review guide redundancy audit 2026-07-06 |
| TB-680 | Hub-page do-not-duplicate IA contract + drift guard — document owning-page rule; forbid ungated system-admin links from hub surfaces; see `## TB-680` below | Maintainability P2 — **V1**; extends **TB-404** / `NAV_CONFIG_CONTRACT.md`; found during First review guide redundancy audit 2026-07-06 |

## Curated slices (manual — spot-check against table above)

### First review guide / onboarding hub (2026-07-06 audit)

| ID | Title | Priority |
| --- | --- | --- |
| TB-675 | Derive Core Pilot checklist from tenant state — **Done** (2026-07-06) | P1 |
| TB-677 | Customer-safe platform health link — **Done** (2026-07-06) | P1 |
| TB-674 | Rename Getting started → First review guide | P2 |
| TB-678 | Role-gate workspace setup on `principalAdmin` | P2 |
| TB-679 | Trial/optional-setup copy drift — **Done** (2026-07-07) | P2 |
| TB-680 | Hub-page do-not-duplicate contract + drift guard | P2 |
| TB-676 | Dedupe cloud inventory from Finish setup wizard | P3 |

### Real-mode / eval (owner or credentialed CI)

**Nightly loop:** **TB-683** (Done 2026-07-08) — `golden-cohort-expanded-nightly.yml` scores committed `*.real.json` exemplars when `ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true`; trend artifacts under `artifacts/real-mode-eval-nightly/`.

| ID | Title |
| --- | --- |
| TB-683 | ~~Nightly real-mode eval loop~~ — **Done** (engineering automation; see `real-mode-eval-nightly.yml`) |
| TB-140 | Real-mode eval corpus (all `simulator` today) |
| TB-139 | Token usage in gate metrics (partial) |
| TB-137 | Quad-agent live pipeline (owner re-run evidence) |

### Architecture / provenance / determinism stragglers

| ID | Title |
| --- | --- |
| TB-011 | Invariant Wave B remainder (persisted gate read path, dual-replica budget CI harness) |
| TB-012 | Invariant Wave C |
| TB-034 – TB-038, TB-040, TB-044 – TB-056 | Provenance / determinism / explainability gaps |

### GTM / owner-blocked

**TB-141**, **TB-142**, **TB-135/136** (V1.1), **G-REAL-01–04**.

### Sonnet architecture / design questions (SAQ)

Register: [`SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md`](SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md). **TB-313** **Done** (register + mirror authority + ADR 0048–0050).

| ID | Title | SAQ |
| --- | --- | --- |
| TB-317 | Workspace/project IDOR V1 pilot posture | SAQ-006 |
| TB-318 | Sonnet SAQ review cadence before RC signoff | (process) |

Open SAQs without TB yet: **SAQ-007** (claim stage evidence, P0), **SAQ-008** (simulator/live divergence, P0), **SAQ-010** (P0 invariant enforcement), **SAQ-011** (claim-surface consistency, P0), **SAQ-012** (operator misconfiguration, P2). **Resolved:** SAQ-005 (cross-catalog 2PC — TB-316 Done).
