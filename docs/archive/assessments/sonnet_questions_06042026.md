> **Reviewed:** 2026-07-22

# ArchLucid architecture & design — questions for Sonnet

**Purpose:** High-leverage prompts for a Sonnet session focused on **architecture and design reasoning**, not implementation. Each question is grounded in findings from the 2026-06-03 buyer-demo UI audit (**TB-273 / BDA-001…150**) and pre-demo backend/platform audit (**TB-274 / BE-001…061, SEC-001…035**).

**How to use:** Paste one theme (or the full doc) into Sonnet with relevant backlog sections or code paths. Ask for **trade-offs, alternatives considered, and explicit uncertainty** — not yes/no answers.

**Related artifacts:**
- `docs/library/TECH_BACKLOG.md` — `## TB-273`, `## TB-274`
- `docs/library/ASSESSMENT_QUALITY_MODEL.md`
- `.cursor/rules/Assessment-Scope-V1_1.mdc`

---

## 1. Tenant isolation & the RLS decision

The sharpest architectural tension: SQL RLS was removed (DbUp 148); isolation now depends on application-layer scope predicates and optional per-tenant catalogs. Several `{tenantId}`-in-route endpoints derive scope from the route instead of the authenticated principal.

1. **RLS removal — first principles:** RLS was removed and isolation now depends on application-layer scope predicates. Walk through the first-principles case for that decision — what did it buy, and what's the blast radius if a single repository query forgets its `WHERE TenantId`? Would you defend this for a healthcare/financial buyer, or move to per-tenant databases or schemas?

2. **COMPLETED:  Route-based tenant addressing:** Several `{tenantId}`-in-route admin endpoints (executive summary, reference-evidence export, metering) derive scope from the route instead of the authenticated principal (`ExecutiveSummaryController`, `ReferenceEvidenceAdminController`, `MeteringAdminController`). Is route-based tenant addressing ever a defensible pattern, or should tenant always be ambient from the token? What's the cleanest single enforcement point?

3. **Canonical enforcement layer:** Where *should* tenant scope be enforced — middleware, repository base class, or database? Argue for one canonical layer instead of the current mix (middleware for API keys, partial JWT header binding, per-repository predicates, removed RLS).

4. **Default tenant fallback:** Authenticated requests with no scope claims fall back to `ScopeIds.DefaultTenant`. Is that an acceptable bootstrap pattern, or a production foot-gun? What should happen instead?

5. **Admin vs platform operator:** `AdminAuthority` maps to tenant `Admin`/`WorkspaceAdmin`, not platform operator — yet admin routes accept arbitrary `{tenantId}`. How should RBAC be modeled so "tenant admin" and "platform admin" cannot be conflated?

---

## 2. Evidence integrity (core product promise)

For a governance/evidence product, committed-run data is treated as durable proof. Current code paths mutate evidence in place (delete-and-reinsert) without audit on several surfaces.

6. **Immutability after commit:** For a governance/evidence product, should *any* committed-run data ever be mutated in place? Today `AgentResults`, evidence bundles, and provenance snapshots use delete-and-reinsert (`AgentResultRepository.CreateManyAsync`, `EvidenceBundleRepository.UpdateAsync`, `SqlProvenanceSnapshotRepository.SaveAsync`). Make the case for append-only/event-sourced evidence vs. the cost of that change.

7. **Minimum viable tamper-evident story:** What's the minimum viable "tamper-evident" story for V1 — append-only SQL with DENY permissions on `AuditEvents`, or do regulated buyers actually require cryptographic/WORM guarantees? Where's the honest line between what we can claim and what we've built?

8. **Dual disposition sources:** ITSM webhooks update `FindingRecords.HumanReviewStatus` directly while operator dispositions go through `FindingReviewEvents`. How do you design a single source of truth without coupling the integration layer to the domain model?

9. **Post-commit side effects:** Optional post-commit jobs (IaC stub generation, finding priority rerank) rewrite sealed data. Should post-commit work be read-only analytics, or is controlled mutation acceptable if audited? Where's the boundary?

10. **Evidence bundle tenancy:** `dbo.EvidenceBundles` has no `TenantId` — global PK on `EvidenceBundleId` only. Was that a deliberate denormalization (bundles always reached via scoped runs), or a schema gap? How would you fix it without a big-bang migration?

---

## 3. Demo / production separation

Demo data, static UI fallbacks, and anonymous demo endpoints are gated by environment flags. Buyer-polished UI can mask backend failures.

11. **Flag-based vs physical separation:** Demo data, static UI fallbacks, and anonymous demo endpoints are gated by env flags (`Demo:Enabled`, `Demo:AnonymousViewer:Enabled`, `SaaSGuestSeedEnabled`). Is flag-based separation the right architecture, or should the demo experience be a physically separate deployment/tenant? What's the failure mode of flag drift?

12. **UI synthesizing success:** The UI can fall back to static showcase data for known run IDs without demo env vars (`operator-static-demo.ts`). Argue whether a presentation layer should *ever* be allowed to synthesize success when the backend is empty.

13. **Anonymous demo APIs:** `DemoViewerController` and `DemoCommitPagePreviewController` expose full run shapes when flags are on. What's the right threat model for "public demo" vs "authenticated product" — separate services, separate tenants, or feature flags only?

14. **Demo seed on startup:** `DemoSeedStartupHostedService` logs seed failures as warnings. Should demo readiness be a hard readiness-check failure, or is degraded acceptable for marketing/demo SKUs?

---

## 4. API contract & boundary design

Internal identifiers and implementation details leak on buyer-facing responses. Idempotency and error contracts have gaps.

15. **COMPLETED: DTO boundary:** We expose internal identifiers (snapshot IDs, OTel trace IDs, raw enums, API route strings in error bodies) on buyer-facing responses. How would you design the DTO boundary so internal vs. business representations can't leak — and how do you keep it from drifting (CI, OpenAPI tiers)?

16. **LLM trace exposure:** `GET /v1/architecture/run/{runId}/traces` returns full prompts and raw model output to `ReadAuthority`. Is that a product feature or a forensics/admin feature? How do you partition observability data from buyer-facing API surfaces?

17. **Idempotency contract:** Batch create idempotency replay returns an empty payload. How should idempotent replays behave for regulated change-window automation — stored response replay, 409 conflict, or something else?

18. **Problem Details consistency:** Some endpoints return ad-hoc JSON (413 traceability ZIP, 503 Azure extractor) while others use RFC 9457 Problem Details. Does inconsistency here matter for enterprise integrators, and what's the minimal standardization path?

19. **OpenAPI surface split:** Public OpenAPI includes `/v1/internal/*` and admin diagnose routes. Should buyer security reviews see one contract or two — and how do you enforce that in CI?

---

## 5. Background work, jobs & consistency

Mixed durability: worker-only job processor, fire-and-forget export push, infinite re-poll on failed preseed.

20. **Job orchestration model:** Recurrence, preseed, and export-push run as background work with mixed durability (worker-only processor, fire-and-forget `Task.Run`, infinite re-poll on NULL `TrialWelcomeRunId`). What's the right job/orchestration architecture for at-least-once-with-idempotency in this domain — and where does an outbox belong?

21. **Hosting role split:** Durable background jobs process only on `ArchLucidHostingRole.Worker`. Is API+Worker "Combined" a deployment requirement or an implementation detail? What breaks if ops deploys API-only?

22. **Export push SSRF:** Customer-supplied SAS URLs on export push. Beyond allowlisting blob hosts, is "push to customer blob" the right abstraction, or should exports always be pull-from-tenant-scoped storage with short-lived read SAS generated server-side?

23. **Recurrence failure visibility:** Recurrence polling swallows errors per schedule. How should recurring governance workflows surface failure to operators — inbox, health check, auto-disable after N failures?

---

## 6. Security architecture (JWT, API keys, demo bypasses)

Production config blocks `DevelopmentBypass`, but JWT scope and demo surfaces need architectural clarity.

24. **JWT scope claims vs headers:** API keys cannot use `x-tenant-id` without a bound claim; JWT can. Is header-based scope ever correct for browser clients, or should production always embed tenant/workspace/project in the token?

25. **API key blast radius:** Admin API keys carry broad permissions (`commit:run`, `seed:results`, `export:consulting-docx`). How would you decompose keys by capability for least privilege without multiplying integration friction?

26. **E2E harness in non-prod:** Anonymous E2E harness mutates arbitrary tenants with a shared secret. Is a shared-secret harness the right pattern, or should each CI run get ephemeral credentials?

27. **RequireJwtBearerInProduction defaults false:** Should production SaaS fail closed on API-key-only auth, or is long-lived API key a valid enterprise pattern?

---

## 7. Observability & operability

28. **Health check semantics:** Readiness aggregates 20+ checks; demo viewer can mark the host Degraded while still "ready." How should orchestrators interpret Degraded vs Unhealthy for a multi-SKU product (demo vs enterprise)?

29. **Correlation across async work:** Export push runs in `Task.Run` without guaranteed correlation/scope propagation. Where should correlation IDs and tenant scope be captured for async audit trails?

30. **Audit read isolation:** Audit listing uses `NOLOCK`. Is eventual consistency acceptable for compliance export, or should audit reads be strictly consistent?

---

## 8. Testing & regression architecture

31. **IDOR test matrix:** TB-073 tests snapshot reads but not executive-summary or admin tenant routes. What should a "tenant isolation regression suite" cover, and should it be merge-blocking for every `{tenantId}` route?

32. **Evidence immutability tests:** There are no tests asserting committed runs reject mutation or emit audit on supersede. What behavioral contracts should be encoded as integration tests vs. DB constraints?

33. **Demo/production config tests:** UI has CI guards for buyer-polished demo env; backend demo seed is not gated the same way. Should configuration drift be one unified architecture test across API + UI?

---

## 9. Strategy & meta-questions (often highest value)

34. **Top five before pilot:** If you could only fix six *architectural* things, what would they be and why — ranked by risk, not effort?

35. **Load-bearing assumptions:** What are the load-bearing assumptions in this design that, if wrong, would force a costly rewrite later? (Examples: single shared DB, append-in-place agent results, flag-based demo, JWT+header scope hybrid.)

36. **Over- vs under-engineered for V1:** Where is ArchLucid over-engineered for V1 (complexity that isn't earning its keep) vs. under-engineered for the regulated promise (evidence immutability, tenant isolation, demo separation)?

37. **CISO attack surface:** What would a skeptical CISO's security architect attack first in diligence, and does the current design have a clean answer — or only a "we'll fix it" answer?

38. **Critique the audits:** Given TB-273 (UI) and TB-274 (backend), where did the audit overreach or miss the real root cause? Which findings are symptoms vs. which imply structural design debt?

39. **ValueReportController as pattern:** `ValueReportController` compares route `tenantId` to scope and returns 403. Should that pattern be elevated to a framework filter/interceptor for all `{tenantId}` routes, or is ambient-scope-only (no route param) strictly better?

40. **Buyer-polished shell hiding backend gaps:** Buyer-polished UI polish (TB-273) can present a credible demo while backend IDOR and evidence mutation exist (TB-274). Is "demo shell" a valid product architecture layer, or dangerous decoupling from backend truth?

---

## Suggested Sonnet session prompts

### Single-theme deep dive
> Read `docs/library/TECH_BACKLOG.md` sections TB-274 (BE-014, BE-022, BE-023, SEC-01, SEC-06, SEC-07) and question #6–10 above. Argue for append-only committed-run evidence vs. pragmatic in-place updates. Include trade-offs, migration cost, and what we can honestly claim to a regulated buyer in V1 vs V1.1.

### Architecture review mode
> You are reviewing ArchLucid's multi-tenant isolation architecture. RLS was removed; isolation is app-layer. Cross-tenant IDOR exists on three admin/executive routes. JWT can steer scope via headers. Propose a target-state enforcement model in ≤2 pages: components, enforcement points, migration phases. Do not write code.

### Audit red-team
> Here are 96 backend findings (TB-274) and 150 UI findings (TB-273). Group them by *root architectural cause* (not symptom). Which 3 root causes would you fix first? Which findings are false positives or acceptable for demo-only mode?

---

## Context snippet (paste with questions)

**P0 backend themes (TB-274):** Cross-tenant IDOR on executive summary and admin export/metering; verification token in trial register response; full LLM prompts on traces API; `AgentResults` delete-on-retry post-commit; global `EvidenceBundles` without tenant scope; export-push arbitrary SAS (SSRF); demo seed + UI static fallback masking API failure.

**P0 UI themes (TB-273):** Demo/sample leakage (Claims Intake, Jordan Lee/Taylor Morgan personas); fabricated decision/confidence/audit-link fallbacks; misleading "Audit trail complete" / "placeholder" / "Demo-derived" claims; dead `#run-actions` finalize anchor in buyer mode.

**Positive controls to preserve in any redesign:** `ValueReportController` scope check; API-key header binding (TB-072); `ScopedSnapshotReadIdorIntegrationTests`; Production rejection of `DevelopmentBypass`; Problem Details pipeline; blob tenant prefix via `ArtifactBlobTenantPaths`.
