> **Reviewed:** 2026-07-28

> **Scope:** Contributor-reference — sales, marketing, and agent authoring for what ArchLucid may say in V1 vs deferred `(B)` / V1.1 items; buyer-facing claim guardrails (TB-134) plus the GTM “what not to promise” table (formerly `docs/go-to-market/WHAT_NOT_TO_PROMISE.md`) and PA claim-honesty Batch A paste-ready bullets (formerly the body of `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_A.md`; that filename remains a path-stable alias). PA claim-honesty rows (M-115+) in the table below; index: [`../go-to-market/PA_CLAIM_HONESTY_INDEX.md`](../go-to-market/PA_CLAIM_HONESTY_INDEX.md).

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

**Batch A related:** [`PROMPT_INJECTION_RESISTANCE_BUYER_ONE_PAGER.md`](../go-to-market/PROMPT_INJECTION_RESISTANCE_BUYER_ONE_PAGER.md) · [`SECURITY_REVIEWER_AUDIT_TRAIL_ONE_PAGER.md`](../go-to-market/SECURITY_REVIEWER_AUDIT_TRAIL_ONE_PAGER.md) · [this section’s parent table](#gtm-do-not-promise).

### Canonical deferral docs

- [`V1_SCOPE.md`](V1_SCOPE.md) §3
- [`../go-to-market/trust-center.md`](../go-to-market/trust-center.md)
- [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)

Former standalone: `docs/go-to-market/WHAT_NOT_TO_PROMISE.md` → this section.  
Former standalone: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_A.md` → [`#pa-claim-honesty-bullets-batch-a`](#pa-claim-honesty-bullets-batch-a).

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
