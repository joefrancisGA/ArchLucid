> **Reviewed:** 2026-07-29

> **Scope:** Contributor-reference — sales, marketing, and agent authoring for what ArchLucid may say in V1 vs deferred `(B)` / V1.1 items; buyer-facing claim guardrails (TB-134) plus the GTM “what not to promise” table (formerly `docs/go-to-market/WHAT_NOT_TO_PROMISE.md`), PA claim-honesty Batch A paste-ready bullets (formerly `PA_CLAIM_HONESTY_BULLETS_BATCH_A.md`; path-stable alias), Batch B (formerly `PA_CLAIM_HONESTY_BULLETS_BATCH_B.md`; path-stable alias), and Batch C (formerly `PA_CLAIM_HONESTY_BULLETS_BATCH_C.md`; path-stable alias). PA claim-honesty rows (M-115+) in the table below; index: [`../go-to-market/PA_CLAIM_HONESTY_INDEX.md`](../go-to-market/PA_CLAIM_HONESTY_INDEX.md).

# Public claim boundary guide (TB-134)

## Allowed V1 claims (with proof)

- Architecture-review evidence from **committed** runs with labeled execution mode
- Self-assessed security posture and trust-center honesty (not CPA SOC 2)
- Service-led **AI & Cloud Architecture Readiness Review** and guided pilot paths
- ROI figures only when `roiBasisStatus` is classified and sponsor-safe

## Never imply in V1 copy (without explicit deferred caveat)

| Prohibited implication | Why | Say instead |
| --- | --- | --- |
| SOC 2 certified / CPA attested | TB-135 V1.1 backlog | Self-assessment; roadmap to CPA program |
| Buy on Azure Marketplace today | Commerce un-hold deferred | Request quote / guided pilot |
| Live Stripe production checkout | Build-flag gated | Request quote unless flag explicitly enabled |
| Public reference customer available | GTM owner output | Anonymized pilot evidence only |
| HIPAA / PCI / ISO **certification** from ArchLucid | Policy packs are advisory | Architecture-review input, not attestation |
| Simulator-only output equals production AI guarantee | G-REAL evidence required | Label execution mode and limitations |

## GTM do-not-promise (sales / proof packets / sponsor email) {#gtm-do-not-promise}

Separates `(A)` product readiness from `(B)` procurement realism. Use in sales, proof packets, and sponsor email.

| Topic | Safe wording | Do not promise |
| --- | --- | --- |
| SOC 2 CPA attestation | "Trust pack + control narrative; CPA program deferred" | "We are SOC 2 certified" |
| Third-party pen test | "Owner security testing + templates; vendor pen test deferred" | "Independent pen test report available" |
| Live Marketplace / Stripe checkout | "Quote + order-form path; self-serve commerce deferred" | "Buy on Marketplace today" |
| Named reference customer | "Demo proof packets + founder-led pilot" | "Customer X saved Y%" without approval |
| MCP / plugin marketplace | "REST/CLI integration recipes" | "MCP marketplace GA" |
| V1.1 connectors (Jira, ServiceNow, …) | "V1 REST/CLI/export handoff; roadmap connectors labeled V1.1" | "Native Jira/Teams GA in V1" |
| Multi-region active/active | "Single-region pilot deployment documented" | "Active/active multi-region SLA" |
| Realized ROI USD | "Source-classified estimates; tenant baselines when captured" | "Guaranteed $ savings" |
| Invoiced Azure OpenAI cost | "Budget estimates and token rollups" | "Invoice-accurate COGS" |
| Prompt injection (M-115/M-116) | "Host confinement: docs/repo as DATA; tool allowlists; residual prose influence" | "Prompt-injection proof" / "We sanitize architecture PDFs" |
| Audit Required vs informational (M-117/M-118) | "Required governance/finalize/identity/export events fail-closed durable trail (TB-953); telemetry may be best-effort" | "Every audit event is transactional" / "Same-TX on all audit today" |
| Solo-operator MVO (M-119) | "P0 catalog exists; paging requires enabled path + drill (M-120)" | "Second SRE platform" / "Every failure pages before a ticket" |
| ACA Worker LLM interrupt (M-121/M-122) | "Resume skips persisted (RunId,TaskId); provider at-least-once" | "Exactly-once LLM" / "Zero duplicate spend on replica death" |
| Execution vs quality outcome (M-123/M-124) | "HOLD/quality reject ≠ outage; separate model-failed vs quality-rejected" | "Perfect AI quality" / "LLM error for every red run" |
| Inbound webhooks (M-125/M-126) | "Signed + ordered controls; replay/size gaps until TB-968/TB-967" | "Pipeline order in docs = internet-safe" / "Signed = fully hardened" |
| Execution mode INV-002 (M-127/M-128) | "Disclose Real/Mixed/Simulator/Fallback; never promote Mixed→Real" | "Quality green ⇒ Real" / "Cache = Simulator" |
| Quality-gate versioning (M-129/M-130) | "Pass is as-of gate definition version; no silent re-grade of history" | "Eternal AI correctness" / "Threshold upgrade rewrites old outcomes" |
| LLM budget INV-004 (M-131/M-132) | "SQL + concurrency prevent hard-cap bypass; orphans/races residual" | "Crash-proof settle" / "Zero orphan reserved USD" / "No race soft-DoS" |
| Simulator ROI (M-138/M-139) | "Illustrative estimate / not customer-realized; Real + labeled baselines only for sponsor $" | "Customer saved $X from Simulator" / "Proven savings from demo" |
| Finding disposition race (M-140/M-141) | "Finding approve/reject append-only last-by-time unless mutex ships" | "Finding approve is first-wins CAS like governance queue" |
| Outbox delivery (M-144/M-145) | "At-least-once; consumers must be idempotent" | "Exactly-once integration events" |
| Polly vs run completeness (M-146/M-147) | "Transport resilience ≠ finished multi-agent run" | "Polly means runs always complete" |
| LLM trust boundary (M-148/M-149) | "Host-composed ingress; no model tool-loop for HTTP/shell/ITSM; residual TB-950" | "Injection-proof customer docs" / "Model cannot influence finding text" |
| INV-001 decide-once (M-150/M-151) | "Host ScopeContext; headers ≠ prod tenant; no deep-layer re-derive" | "x-tenant-id establishes tenant" / "App layer re-parses JWT for tenant" |
| Retrieval tenancy (M-152/M-153) | "Mandatory OData scope filter + upsert validation; not per-tenant Search index" | "Crypto-proof Search isolation" / "Dedicated index per tenant" |
| Committed manifest truth (M-154/M-155) | "Only committed golden manifest + ManifestHash is unit of truth" | "Findings list / Ask answer / Simulator output is the signed package" |
| Solo-ops single-tenant miss (M-142/M-143) | "Fleet P0s ≠ per-tenant stuck-run page before every ticket; Report Problem is inbox-by-design" | "Every tenant failure pages the founder before support email" |
| Layer-boundary / NetArchTest (M-156/M-157) | "Compile-time DAG + catalogs + INV-001 + retrieval filters; residual irreversible leaks named" | "NetArchTest alone proves multi-tenant isolation" |
| Authority vs AgentTask (M-158/M-159) | "Authority is canonical; execute/result/commit only for intentional task-loop ownership" | "Every create requires execute before value" / "Dual coordinator storage still ships" |
| Append-only / sealed evidence (M-160/M-161) | "Append-only AuditEvents + sealed evidence + hash/export verify; corrections append" | "Editable audit log" / "Platform-operated WORM" |
| Finalize vs outbox (M-162/M-163) | "Commit seals package + enqueues outbox; Search/webhook/Cosmos may lag" | "Commit success means indexed and delivered" |
| Read-after-write (M-164/M-165) | "Poll/SSE until golden manifest; disclose projection/replica lag" | "Create returns review-ready package" / "Commit makes Ask/ITSM immediately consistent" |
| PilotStrict ≠ Real (M-166/M-167) | "Quality pass ≠ live-model sponsor proof; disclose Simulator/Fallback/Mixed" | "PilotStrict green means Real sponsor proof" |
| Empty-scope catalog routing (M-168/M-169) | "Typed scope required; Empty→system catalog / SingleCatalog predicate risk disclosed" | "Unscoped queries are safe" / "Empty TenantId returns no data" / "RLS protects production" |
| Process vs provider LLM billing (M-170/M-171) | "Process skip only after persisted successful (RunId,TaskId); provider at-least-once" | "Exactly-once LLM" / "Zero duplicate spend on retry" |
| Pre-finalize gate / SoD (M-172/M-173) | "Optional enforcing gate + assignment thresholds; Advisory does not block; SoD = submitter≠approver" | "Every pack blocks finalize" / "Packs are certifications" / "SoD requires different committer always" |
| Comparison/replay drift (M-174/M-175) | "Persisted ComparisonRecord + committed manifests; verify for buyer drift claims" | "Artifact replay proves architecture unchanged" / "Live UI side-by-side equals verify" |
| Operator primary object (M-176/M-177) | "Architecture package is primary; findings/decisions are children; /reviews spine" | "Findings are the hireable unit of truth" / "Create and review are two equal products" |
| `/see-it` static vs live (M-178/M-179) | "One universe per page; Contoso≠Claims; Q21 min = Option A or B" | "Healthcare Claims sample while Contoso preview serves" / "Anonymous preview is tenant-accurate" |
| Showcase naming / Contoso–Northwind (M-135) | "Scenario-first: Showcase → scenario name → sample review → illustrative sample; Contoso/Northwind OK as internal seeds only" | "Contoso/Northwind as buyer showcase org or primary one-sentence" / "Contoso under Claims chrome" / "Implying fictional seeds are real customers" |
| First-15 / package spine (M-180/M-181) | "Finalize + sponsor export co-located; minute-12 evidence checkpoint; no M-44 proof yet" | "15 minutes without founder narration guaranteed" / "Won't dismiss" without cohort |
| Launch-load failure order (M-182/M-183) | "HTTP scale ≠ AOAI TPM; drill pending until G-SCALE-02; commit survives worker lag" | "Scale-out removes 429" / "Launch load proven without drill" |
| Strangler next slice (M-184/M-185) | "Authority product-default; /result does not commit; dual storage gone" | "create→execute→commit is default peer lifecycle" / "POST /result finalizes" |
| Competitive deal-loss (M-186/M-187) | "Hypothesis kill-order until M-20; complement Confluence/Miro/SN; win=manifest+trail" | "Measured win/loss proven" / "Replaces ServiceNow" / "Cheaper than Copilot seats" |
| Stage 0 allowlist (M-188/M-189) | "Committed package + mode label + evidence-linked findings; G4 HOLD" | "Proven across N pilots" / "SOC 2 certified" / "Marketplace buy today" |
| Pilot trust without CPA/3P (M-190/M-191) | "Six-element Real SEND + labeled self-attested substitutes" | "Pilot bar requires CPA SOC 2 or published 3P pen test" |
| First security review ship order (M-192/M-193) | "Must: M-114 + M-151 + M-118; should M-124 if AI; defer M-171" | "Ready for security review = all PA one-pagers + CPA" |
| Isolation overclaim (M-194/M-195) | "Database-per-tenant + INV-001 + identity-wins (M-114); RLS non-control" | "SQL RLS is a production control" / "NetArchTest alone proves isolation" |
| SOC 2 / pen-test talk-track (M-196/M-197) | "Intent → evidence-type label → pack → defer with funding trigger" | "SOC 2 ready/almost" / "Pen test in flight" when only self-assessment exists |
| AOAI model retirement (M-273/M-274) | "Committed packages + stored-source replay survive; Real re-exec on retired pin does not" | "Bit-identical Real re-execution forever" / "Auto-upgrade preserves ManifestHash identity" |
| Paying-tenant spend storm (M-294/M-295) | "Tenant gates fail-closed; metering ≠ Azure invoice; stolen key burns headroom" | "Metering reconciles to Azure invoice for disputes" / "Per-key spend isolation" |
| Shared TPM fairness (M-296/M-297) | "No cross-tenant TPM fair share; neighbor can drive 429/breaker" | "Fair shared AOAI TPM across tenants" |
| Customer policy-pack sandbox (M-298/M-299) | "Declarative in-process engine; pin at commit; tenant-local blast radius" | "WASM sandbox" / "Packs are certifications" / "Broken rule takes down all tenants" |
| Reasoning system (M-300/M-303/M-304) | "Evidence-supported inference; structural enforcement; held-out benchmark honesty" | "Hallucination-proof" / "Beats expert architects" / "Deterministic semantic verification" |

### PA claim-honesty bullets — Batch A {#pa-claim-honesty-bullets-batch-a}

Former standalone body: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_A.md` → this subsection (filename kept as a path-stable alias). Paste-ready GTM claim-boundary bullets for the first PA security-review batch — not independent assurance attestations. Compressed one-line rows for the same M-* topics appear in the table above.

**Path-stable alias:** [`PA_CLAIM_HONESTY_BULLETS_BATCH_A.md`](../go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_A.md).

#### M-116 — Prompt-injection posture

| Do not promise | Do promise |
| --- | --- |
| “Prompt-injection proof,” “we sanitize every architecture PDF,” or that Azure AI Content Safety alone makes the product safe. | Customer docs and repo content are treated as DATA in host-composed ingress; confinement, structured evidence, and Content Safety are layered controls with residual risk. |

#### M-117 — Required versus informational audit

| Do not promise | Do promise |
| --- | --- |
| Every audit event is transactional, complete, or equivalent to immutable external storage. | Required governance/finalize/identity/export events are fail-closed durable trail; cost, projection, and funnel telemetry can be best-effort. |

#### M-119 — Solo-operator observability

| Do not promise | Do promise |
| --- | --- |
| A P0 alert catalog means every tenant or stuck run is automatically paged, or that a second SRE platform is operating. | Fleet P0 monitoring is documented; per-tenant/stuck-run paging and create→execute→finalize canary coverage remain open under **TB-958**–**TB-959**. |

#### M-121 — Interrupted LLM execution

| Do not promise | Do promise |
| --- | --- |
| Exactly-once LLM execution, zero duplicate spend after replica death, or provider refunds for in-flight calls. | Resume can skip persisted completed `(RunId,TaskId)` work; in-flight calls can retain uncertain spend and outcome after a hard interruption. |

#### M-123 — Execution failure versus quality outcome

| Do not promise | Do promise |
| --- | --- |
| A quality HOLD is a platform outage, or that a quality gate guarantees perfect AI output. | Timeout/parse/transport failures are distinct from completed outputs rejected by quality controls; a HOLD is a governed outcome. |

#### M-125 — Inbound webhook exposure

| Do not promise | Do promise |
| --- | --- |
| A signed webhook or documented processing order is fully hardened against hostile internet traffic, replay, or denial of service. | The target intake order is rate → bounded size → verify → parse; replay/idempotency and bounded-body completion remain tracked under **TB-966**–**TB-968**. |

#### M-127 — Execution-mode labels

| Do not promise | Do promise |
| --- | --- |
| Mixed, cache-served, Simulator, or Fallback work is Real evidence; an ROI-period mix proves an individual run was Mixed. | Execution mode is disclosed per applicable run semantics; Mixed/Fallback must never be promoted to Real, and ROI period mix is a separate measure. |

#### M-129 — Quality-gate history

| Do not promise | Do promise |
| --- | --- |
| A historical pass is eternally correct, or threshold upgrades silently re-grade recorded decisions. | A quality outcome is meaningful as of its gate definition; current-threshold comparison is advisory and must remain distinct from the recorded result. |

#### M-131 — LLM budget reserve/settle

| Do not promise | Do promise |
| --- | --- |
| Crash-proof settlement, zero orphaned reserved USD, provider exactly-once billing, or immunity from assumed-max reservation races. | Durable SQL state plus optimistic concurrency blocks multi-replica hard-cap bypass; crash, clock-boundary, and soft-denial residuals remain under **TB-975**–**TB-977**. |

#### M-148 — LLM trust boundary

| Do not promise | Do promise |
| --- | --- |
| Customer content is injection-proof, the model cannot influence finding text, or all `AllowedTools` states are already fail-closed. | The host composes model ingress and provides no model-driven HTTP, shell, or ITSM side-effect loop; output can still influence findings and empty `AllowedTools` remains a **TB-950** residual. |

#### M-150 — Tenant identity single derivation

| Do not promise | Do promise |
| --- | --- |
| `x-tenant-id` establishes production tenant identity, or Application/Persistence re-derive tenant scope from headers, JWTs, or `HttpContext`. | The host resolves typed `ScopeContext` once from trusted identity/ambient sources; production-like hosts reject header-only scope and lower layers consume the resolved context. |

**Batch A related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#prompt-injection-resistance-m-115`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#prompt-injection-resistance-m-115) (`PROMPT_INJECTION_RESISTANCE_BUYER_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-trust-boundary-ingress-m-149`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-trust-boundary-ingress-m-149) (`LLM_TRUST_BOUNDARY_INGRESS_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#security-reviewer-audit-trail-m-118`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#security-reviewer-audit-trail-m-118) (`SECURITY_REVIEWER_AUDIT_TRAIL_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#model-failed-vs-quality-rejected-m-124`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#model-failed-vs-quality-rejected-m-124) (`MODEL_FAILED_VS_QUALITY_REJECTED_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#quality-gate-versioning-m-130`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#quality-gate-versioning-m-130) (`QUALITY_GATE_VERSIONING_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#finding-disposition-concurrency-m-141`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#finding-disposition-concurrency-m-141) (`FINDING_CONCURRENT_DISPOSITION_RACE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-identity-single-derivation-m-151`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-identity-single-derivation-m-151) (`TENANT_IDENTITY_SINGLE_DERIVATION_PA_ONE_PAGER.md` alias) · [this section’s parent table](#gtm-do-not-promise).

### PA claim-honesty bullets — Batch B {#pa-claim-honesty-bullets-batch-b}

Former standalone body: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_B.md` → this subsection (filename kept as a path-stable alias). Paste-ready GTM claim-boundary bullets for PA claim-honesty batch B (**M-138**–**M-188** even IDs) — not independent assurance attestations. Compressed one-line rows for the same M-* topics appear in the table above.

**Path-stable alias:** [`PA_CLAIM_HONESTY_BULLETS_BATCH_B.md`](../go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_B.md).

#### M-138 — Simulator-derived ROI/savings

| Do not promise | Do promise |
| --- | --- |
| Customer-realized $ from Simulator, demo, or HOLD baselines; “saved $X,” “customer ROI,” or “proven savings” from non-Real runs. | Execution mode ≠ ROI source; Simulator → illustrative estimate only; Real + COMPLETE baselines → estimated from tenant baselines with source label; external send requires Real + COMPLETE. |

#### M-140 — Finding concurrent disposition

| Do not promise | Do promise |
| --- | --- |
| Finding approve/reject is mutually exclusive first-wins like the governance approval queue. | Dispositions are append-only (both persist; current = latest by time) unless **TB-986** option B ships a mutex; approval-request CAS claims remain separate. |

#### M-142 — Solo-ops single-tenant miss

| Do not promise | Do promise |
| --- | --- |
| Every tenant-affecting failure pages the founder before a support ticket; fleet MVO P0s equal per-tenant stuck-run coverage. | Fleet P0 monitoring when enabled; per-tenant stuck-run and review-path canary remain open under **TB-958**/**TB-959**; Report Problem is inbox-by-design. |

#### M-144 — Outbox at-least-once delivery

| Do not promise | Do promise |
| --- | --- |
| Exactly-once integration events or side effects; Service Bus duplicate detection as permanent dedupe. | At-least-once publish with replay after crash before `MarkProcessed`; short SB duplicate window; consumers must be idempotent. |

#### M-146 — Polly versus run completeness

| Do not promise | Do promise |
| --- | --- |
| Polly retries + circuit breaker mean multi-agent runs always finish. | Transport resilience only; partial-run, cache, and mid-run budget semantics remain separate (**TB-937**–**TB-945**). |

#### M-152 — Retrieval tenancy

| Do not promise | Do promise |
| --- | --- |
| Dedicated Azure AI Search index per tenant or crypto-proof isolation from a Search hit. | Mandatory OData scope `$filter` + upsert scope validation + Graph-RAG expand from scoped snapshot; platform sentinel ≠ cross-tenant leak. |

#### M-154 — Committed manifest unit of truth

| Do not promise | Do promise |
| --- | --- |
| Findings lists, Ask/RAG answers, drafts, uncommitted runs, Simulator output, or UI summaries are the signed finalized package or full Evidence→audit chain. | Only committed golden manifest (`GoldenManifestId` + `ManifestHash`) is unit of truth; label hop-skips (conversational / draft / illustrative / estimate). |

#### M-156 — Layer boundary / NetArchTest

| Do not promise | Do promise |
| --- | --- |
| Assembly/layer architecture tests alone prove multi-tenant isolation or make cross-tenant leaks impossible. | Compile-time DAG guards + Layer A catalogs + INV-001 + retrieval filters; name residual irreversible class (wrong catalog / unscoped path) and **TB-950** tool hole. |

#### M-158 — Authority versus AgentTask loop

| Do not promise | Do promise |
| --- | --- |
| Every create requires `execute` before value; dual coordinator/authority storage still ships. | Authority pipeline canonical for new surfaces; `execute`/`result`/`commit` only when intentionally owning AgentTask semantics; forbid finishing an authority-finalized run via task loop. |

#### M-160 — Append-only / sealed evidence

| Do not promise | Do promise |
| --- | --- |
| Editable audit log, in-place rewrite of commit-sealed findings/manifests, or platform-operated WORM. | Append-only `AuditEvents` + sealed evidence registry + hash/export verify; corrections append new events or enrichment overlay. |

#### M-162 — Finalize versus outbox

| Do not promise | Do promise |
| --- | --- |
| Commit success means Search indexed, webhooks delivered, Cosmos projected, or every audit event is transactional. | Sealed package + durable outbox enqueue in finalize; disclose Required vs informational audit and delivery lag. |

#### M-164 — Read-after-write

| Do not promise | Do promise |
| --- | --- |
| Create returns a review-ready package; commit success makes Ask/Search/ITSM immediately consistent. | Poll/SSE until golden manifest; disclose outbox and replica lag; name the readiness signal per consumer. |

#### M-166 — PilotStrict ≠ Real

| Do not promise | Do promise |
| --- | --- |
| PilotStrict / AI-readiness pass means live-model sponsor proof; omit Simulator/Fallback/Mixed when quality gates are green. | Execution mode on every sponsor export; Real (or labeled curated sample) before external PDF; quality pass and mode are orthogonal. |

#### M-168 — Empty-scope catalog routing

| Do not promise | Do promise |
| --- | --- |
| Database-per-tenant makes unscoped queries safe; empty TenantId returns no data; SQL RLS protects production. | Typed scope for product SQL; disclose Empty→system catalog and SingleCatalog predicate-only risk. |

#### M-170 — Process versus provider LLM billing

| Do not promise | Do promise |
| --- | --- |
| Exactly-once LLM or zero duplicate spend on retry/interrupt. | Process skip only for persisted successful `(RunId, TaskId)`; disclose provider at-least-once billing. |

#### M-172 — Pre-finalize gate and SoD

| Do not promise | Do promise |
| --- | --- |
| Every policy pack blocks finalize; `priorityFloor` is a commit gate; packs are certifications; SoD requires a different committer; gate is always on. | Optional gate + enforcing assignment thresholds; Advisory/warn-only do not block; SoD = approval submitter≠approver (platform + org roles). |

#### M-174 — Comparison/replay drift

| Do not promise | Do promise |
| --- | --- |
| Artifact-mode replay proves architecture unchanged; live mutable UI side-by-side equals verify. | Persisted `ComparisonRecord` + committed manifests on both sides; **verify** (422 on mismatch) for buyer drift/stable claims; label artifact-only as stored delta replay. |

#### M-176 — Operator primary object

| Do not promise | Do promise |
| --- | --- |
| Findings or decisions are the hireable unit of truth; create and review are two equal products. | **Architecture package** as primary product noun; review = lifecycle; findings/decisions are children. |

#### M-178 — `/see-it` static versus live boundary

| Do not promise | Do promise |
| --- | --- |
| Healthcare Claims sample while serving Contoso `demo/preview`; anonymous preview is tenant-accurate. | One universe per page + fail-closed mismatch; PA Q21 minimum = welcome→`/see-it`→CTA Option A or B. |

#### M-180 — First-15 / package-spine claims

| Do not promise | Do promise |
| --- | --- |
| “15 minutes without founder narration,” “product-led first value,” “no SE required,” or “won’t dismiss” without package spine + minute-12 checkpoint; absent **M-44** cohort as proof. | Finalize + sponsor export co-located on `/reviews/{runId}`; non-obvious finding + evidence → commit → unaided export as PA Q10 see list. |

#### M-182 — Launch-load failure order

| Do not promise | Do promise |
| --- | --- |
| API scale-out removes AOAI 429/TPM limits; launch load “proven” while drill pending; outbox lag loses committed packages or is first sync admit failure under burst. | HTTP-first launch vs AOAI-ceiling Real execute; committed packages durable; worker lag affects projections, not finalize record. |

#### M-184 — Strangler next slice

| Do not promise | Do promise |
| --- | --- |
| Create→execute→commit as default peer lifecycle to Authority; dual coordinator storage still ships; `POST …/result` finalizes/commits. | Authority product-default freeze + AgentTask extension-loop rename + `/result` sunset per owner ADR. |

#### M-186 — Competitive deal loss

| Do not promise | Do promise |
| --- | --- |
| Measured win/loss frequency without **M-20**; ArchLucid replaces Confluence/Miro/ServiceNow/GRC; primary differentiation as Visio bakeoff; cheaper TCO than Copilot seats. | Hypothesis: status-quo manual packaging kills most often; close with committed package + evidence refs + mode-labeled export; pivot = seats draft / ArchLucid proves. |

#### M-188 — Stage 0 allowlist versus oversell

| Do not promise | Do promise |
| --- | --- |
| Stage 1 “evidence-backed selling,” “proven across N pilots,” unlabeled/Simulator-as-production AI, guaranteed $, SOC 2 certified, Marketplace buy today, or named references while Stage 0 and G4 HOLD. | Allowlist: committed package + mode label + evidence-linked findings + mode-labeled export + source-classified ROI + trust honesty. |

**Batch B related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#simulator-roi-sponsor-forbid-m-139`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#simulator-roi-sponsor-forbid-m-139) (`SIMULATOR_ROI_SPONSOR_FORBID_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#retrieval-tenancy-hit-guarantee-m-153`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#retrieval-tenancy-hit-guarantee-m-153) (`RETRIEVAL_TENANCY_HIT_GUARANTEE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#authority-vs-agenttask-loop-m-159`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#authority-vs-agenttask-loop-m-159) (`AUTHORITY_VS_AGENTTASK_LOOP_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#append-only-sealed-evidence-m-161`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#append-only-sealed-evidence-m-161) (`APPEND_ONLY_SEALED_EVIDENCE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#transactional-finalize-vs-outbox-m-163`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#transactional-finalize-vs-outbox-m-163) (`TRANSACTIONAL_FINALIZE_VS_OUTBOX_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#outbox-replay-vs-idempotency-m-145`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#outbox-replay-vs-idempotency-m-145) (`TRANSACTIONAL_OUTBOX_REPLAY_IDEMPOTENCY_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#polly-vs-run-completeness-m-147`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#polly-vs-run-completeness-m-147) (`POLLY_VS_RUN_LEVEL_SURFACE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#read-after-write-client-m-165`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#read-after-write-client-m-165) (`READ_AFTER_WRITE_CLIENT_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#pilotstrict-vs-execution-mode-m-167`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#pilotstrict-vs-execution-mode-m-167) (`PILOTSTRICT_VS_EXECUTION_MODE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#operator-primary-object-nav-collapse-m-177`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#operator-primary-object-nav-collapse-m-177) (`OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_PA_ONE_PAGER.md` alias) · [this section’s parent table](#gtm-do-not-promise).

### PA claim-honesty bullets — Batch C {#pa-claim-honesty-bullets-batch-c}

Former standalone body: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_C.md` → this subsection (filename kept as a path-stable alias). GTM **M-192–M-304** claim-honesty halves. Excludes **M-200** (owner pricing decision) and **M-302** (owner-executed panel).

**Path-stable alias:** [`PA_CLAIM_HONESTY_BULLETS_BATCH_C.md`](../go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_C.md).

Use as preflight language for PA conversations, demos, procurement answers, and buyer-facing copy. Does not replace detailed paired one-pagers or cited evidence. Compressed one-line rows for overlapping M-* topics appear in the parent table above.

#### Do not / Do promise

| GTM | Claim area | Do not | Do promise |
|---|---|---|---|
| **M-192** | First security review ship order | Do not call the review ready without M-114, M-151, and M-118. | Promise a controlled-pilot first-review scope with must, should, and deferred artifacts. |
| **M-194** | Isolation claims | Do not present RLS, workspace labels, or tests as the tenant boundary. | Promise database-per-tenant and INV-001 decide-once, with labeled defense in depth. |
| **M-196** | SOC 2 and pen test | Do not imply CPA SOC 2 or third-party pen-test publication. | Promise available evidence and the controlled-pilot procurement path. |
| **M-198** | Dual hashes | Do not equate cohort SHA with production ManifestHash. | Promise named hash surfaces and deliberate re-lock evidence. |
| **M-201** | Cohort re-lock | Do not call unexplained baseline rewrites proof. | Promise recorded intent, rationale, and never-re-lockable invariants. |
| **M-203** | Agent variance | Do not present free-text proposals as signed decisions. | Promise typed findings, validation, and sealed-graph inputs. |
| **M-205** | Post-strangler coupling | Do not infer no residual coupling from storage completion. | Promise explicit residual hunts and anti-resurrection gates. |
| **M-207** | Finding provenance | Do not call all findings citation-bound without structural provenance. | Promise fail-closed provenance only where emission and commit gates enforce it. |
| **M-209** | Scoring lanes | Do not call semantic scores a commit gate. | Promise the split between structural, async semantic, and promotion lanes. |
| **M-211** | Hallucination defense | Do not infer Real safety from Simulator green. | Promise a shared post-agent defense plane with labeled mode variation. |
| **M-213** | Tenant DiD erosion | Do not equate predicates with the primary boundary. | Promise structural catalogs plus independently described defense layers. |
| **M-215** | Azure privilege seam | Do not infer least privilege from private endpoints. | Promise explicit bootstrap/runtime identity separation and residuals. |
| **M-217** | Demo read plane | Do not call anonymous filters structural isolation. | Promise a dedicated demo plane or static-only surface. |
| **M-219** | Dapper strategy | Do not claim an ORM would solve architecture concerns. | Promise measured signals and an ordered evolution ladder. |
| **M-221** | Commit race | Do not promise exactly-once execution or no LLM rebill. | Promise first-wins commit and the pre-persist execution residual. |
| **M-223** | Schema evolution | Do not treat SchemaVersion as sealed-content migration. | Promise tolerant readers and no rewrite of sealed manifests. |
| **M-225** | LLM cost control | Do not call caps alone mature FinOps. | Promise decorator-chokepoint accounting and disclosed maturity gaps. |
| **M-227** | Fine-tuning promotion | Do not call timestamps rollback-grade governance. | Promise append-only decision records with prior-active and gate data. |
| **M-229** | AOAI throttle | Do not call a queued or fallback run successful Real execution. | Promise retry, optional secondary deployment, then Partial or Failed. |
| **M-231** | Async orchestration | Do not collapse authority commit into agent orchestration. | Promise SQL outbox/Worker first force and separate CAS commit. |
| **M-233** | Terraform drift | Do not claim state alone is authoritative. | Promise per-surface ownership and plan-plus-live proof. |
| **M-235** | Policy evaluation | Do not call pack JSON a programmable certification engine. | Promise hybrid data-plane content and compiled semantics. |
| **M-237** | 100x capacity | Do not claim scale-out creates more AOAI TPM. | Promise TPM-aware admission as the hard-first capacity response. |
| **M-239** | UI over-promise | Do not assume docs scanners cover UI claims. | Promise ranked buyer-facing page review and named owners. |
| **M-241** | Core Pilot path | Do not call empty screens sponsor-ready progress. | Promise request-to-finalize-to-sponsor-packet guidance. |
| **M-243** | Why not ChatGPT/Copilot | Do not claim universal AI superiority or lower TCO. | Promise governed-package and evidence/audit differentiation. |
| **M-245** | Elevator pitch | Do not claim universal time savings or always-on controls. | Promise only what a committed run can demonstrate. |
| **M-247** | AgentTask seams | Do not treat schema validation as all leak prevention. | Promise a path-by-mode-by-gate residual matrix. |
| **M-249** | TB-881 | Do not reopen a completed CI test race as a pilot blocker. | Promise clear CI, pilot, and signup-stress classification. |
| **M-251** | Specialty help | Do not call bare markdown specialty-guided help. | Promise shared chrome, CTA, tier, and residual visibility. |
| **M-253** | INV-001 triad | Do not infer semantic truth from tenant identity or hashes. | Promise separately bounded invariants and named owners. |
| **M-255** | Structural isolation | Do not label conventional controls structural. | Promise a structural, defense-in-depth, and convention classification. |
| **M-257** | Integration empty state | Do not call divergent empty pages integration readiness. | Promise one guided, configuration-aware empty-state contract. |
| **M-259** | See-it ladder | Do not call a curated offline sample a live tenant demo. | Promise labeled demo rungs, mode, and universe. |
| **M-261** | Bake-off | Do not stage EA as a loser or unrun sessions as evidence. | Promise manual-packaging contrast and timed, evidence-led sequence. |
| **M-263** | Claim drift | Do not send packets with critical unresolved drift. | Promise SEND versus REWRITE discipline and owner routing. |
| **M-265** | GDPR erasure | Do not claim automated complete erasure or immutable forever evidence. | Promise the hard-purge boundary and disclosed residuals. |
| **M-267** | Offline export | Do not call file checksums PKI-signed permanent lineage. | Promise offline SHA checks and conditional live verification. |
| **M-269** | Backup and restore | Do not equate append-only storage with tamper-proof backup history. | Promise controlled restore procedures and external anchors. |
| **M-271** | Project deletion | Do not call project purge tenant or evidence erasure. | Promise the project lifecycle and sealed-evidence residue. |
| **M-273** | AOAI retirement | Do not promise bit-identical Real re-execution across retirement. | Promise survival of committed packages and stored-source replay. |
| **M-294** | Tenant spend storm | Do not call estimated product metering invoice reconciliation. | Promise tenant gates and the manual Azure-money-truth boundary. |
| **M-296** | Shared TPM fairness | Do not promise per-tenant fair share of shared TPM. | Promise spend caps and visible Partial/Failed contention behavior. |
| **M-298** | Policy-pack sandbox | Do not call declarative rules a WASM/script sandbox. | Promise bounded interpretation, commit pins, and tenant-local blast radius. |
| **M-300** | Architecture reasoning | Do not call semantic reasoning deterministically verified or expert-beating. | Promise integrity-stage determinism, labeled model inference, and auditable counts. |
| **M-303** | Honest uncertainty | Do not turn uncertainty or risk acceptance into a pass. | Promise separately visible conclusion, evidence, and governance states. |
| **M-304** | Benchmark integrity | Do not report non-held-out results as benchmark performance. | Promise held-out access control and a public measurement methodology. |

#### Global claim controls

| Do not | Do promise |
|---|---|
| Treat planned engineering work, test coverage, or an internal policy as a customer guarantee. | State the shipped mechanism, its scope, the evidence, and the residual. |
| Imply a CPA-issued SOC 2 report or a published third-party pen test. | Describe self-assessment, owner-conducted evidence, and the available controlled-pilot procurement path accurately. |
| Reopen completed engineering tracking for organizational assurance programs. | Route CPA SOC 2 work to **G-REAL-05** and third-party pen-test work to **G-ASSURANCE-02** when owner action is relevant. |

#### Batch C sources

- [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md), detailed rows M-192–M-304.
- Claim maps: [`AOAI model retirement`](AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md), [`paying-tenant spend`](PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md), [`shared AOAI TPM`](SHARED_AOAI_TPM_NOISY_NEIGHBOR_FAIRNESS_CLAIM_MAP.md), and [`policy-pack sandbox`](POLICY_PACK_CUSTOMER_RULE_SANDBOX_PIN_BLAST_RADIUS_CLAIM_MAP.md).
- [GTM do-not-promise table](#gtm-do-not-promise) (formerly `WHAT_NOT_TO_PROMISE.md`).

### Canonical deferral docs

- [`V1_SCOPE.md`](V1_SCOPE.md) §3
- [`../go-to-market/trust-center.md`](../go-to-market/trust-center.md)
- [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)

Former standalone: `docs/go-to-market/WHAT_NOT_TO_PROMISE.md` → this section.  
Former standalone: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_A.md` → [`#pa-claim-honesty-bullets-batch-a`](#pa-claim-honesty-bullets-batch-a).  
Former standalone: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_B.md` → [`#pa-claim-honesty-bullets-batch-b`](#pa-claim-honesty-bullets-batch-b).  
Former standalone: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_C.md` → [`#pa-claim-honesty-bullets-batch-c`](#pa-claim-honesty-bullets-batch-c).

## CI enforcement

- `python scripts/ci/check_claim_evidence_consistency.py` (unified gate + JSON report — T2-8)
- `python scripts/ci/check_compliance_posture_clarity.py`
- `python scripts/ci/check_commercial_overclaim_guard.py` (includes marketing UI paths)
- `python scripts/ci/check_proof_summary_promise_language.py` (forbidden phrase warn scan)

See [`CLAIM_EVIDENCE_CONSISTENCY_GATE.md`](../quality/CLAIM_EVIDENCE_CONSISTENCY_GATE.md).

## Linked artifacts

- [`../go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-review-engagement-pack-tb-133`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-review-engagement-pack-tb-133)
- [`QUOTE_TO_PROOF_PACKET.md`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-checklist)
- [`tier_fit_validation_matrix.v1.json`](../../scripts/ci/data/tier_fit_validation_matrix.v1.json)
