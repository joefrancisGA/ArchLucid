> **Scope:** Contributor-reference — sales, marketing, and agent authoring for what ArchLucid may say in V1 vs deferred `(B)` / V1.1 items; buyer-facing claim guardrails (TB-134) plus the GTM “what not to promise” table (formerly `docs/go-to-market/WHAT_NOT_TO_PROMISE.md`), PA claim-honesty Batch A paste-ready bullets (formerly `PA_CLAIM_HONESTY_BULLETS_BATCH_A.md`; path-stable alias), Batch B (formerly `PA_CLAIM_HONESTY_BULLETS_BATCH_B.md`; path-stable alias), and Batch C (formerly `PA_CLAIM_HONESTY_BULLETS_BATCH_C.md`; path-stable alias). PA claim-honesty rows (M-115+) in the table below; index: [`../go-to-market/PA_CLAIM_HONESTY_INDEX.md`](../go-to-market/PA_CLAIM_HONESTY_INDEX.md).

> **Reviewed:** 2026-08-10

# Public claim boundary guide (TB-134)

**Weekly drift inventory (SEND vs REWRITE):** [`WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md`](WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md) (**TB-1463** Done — closure snapshot lists **C1**/**C2** rows still open in this guide; PA triage: [`BUYER_SECURITY_PROCUREMENT_PACKET.md#weekly-buyer-claim-drift-m-264`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#weekly-buyer-claim-drift-m-264)).

## Allowed V1 claims (with proof)

- Architecture-review evidence from **committed** runs with labeled execution mode
- Self-assessed security posture and trust-center honesty (not CPA SOC 2)
- Service-led **AI & Cloud Architecture Readiness Review** and guided pilot paths
- ROI figures only when `roiBasisStatus` is classified and sponsor-safe

## Never imply in V1 copy (without explicit deferred caveat)

| Prohibited implication | Why | Say instead |
| --- | --- | --- |
| SOC 2 certified / CPA attested | Tech **TB-135** Done; CPA attestation owner **G-REAL-05** (not issued) | Self-assessment; roadmap to CPA program |
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
| Native connectors (Jira, ServiceNow, Microsoft Teams) | "V1 GA first-party connectors with honest empty-state/credential caveats (**TB-1420**)" | "Native connector GA with zero setup everywhere" / "Connectors not in V1" |
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
| Concurrent execute + commit race (M-221/M-222) | "First-wins commit; process skip after (RunId,TaskId) persist; finalize ≠ async delivery" | "Exactly-once commit" / "Retries never spend" / "Idempotency-Key equals CAS" |
| Manifest content-schema evolution (M-223/M-224) | "Tolerant readers; SchemaVersion activate-or-retire; sealed never rewrite" | "SchemaVersion upgrades history" / "Dual-write migrates sealed content" |
| LLM cost-control plane (M-225/M-226) | "Decorator-chokepoint accounting; caps alone ≠ mature FinOps" | "Warn/kill + monthly cap = FinOps" / "Call-site reserve prevents bypass" |
| FT promotion decision record (M-227/M-228) | "Append-only prior-active + ratios/floor + pins + actor + reason" | "Timestamps = code-rollback audit" / "Cache eviction is the audit record" |
| Real-execute AOAI throttle (M-229/M-230) | "Retry → optional secondary AOAI → Partial/Failed; labeled Simulator only on non-proof paths" | "429 → Simulator success" / "Queued = Real success" |
| Async orchestration first-force (M-231/M-232) | "Request-lifetime Real → SQL outbox/Worker; commit stays CAS" | "V1 requires DTF" / "Commit is an orchestrator activity" |
| Container Apps Terraform authority (M-233/M-234) | "Per-surface ownership; plan + live TF-owned compare" | "TF state alone is SoT" / "Preflight = no Azure drift" |
| Policy-pack evaluation hybrid (M-235/M-236) | "Data-plane content + compiled interpreter; pins; not a pack DSL" | "Compile-per-pack engine" / "Pack JSON = certification language" |
| 100× review-volume capacity (M-237/M-238) | "TPM hard-first; SLI ledger + admission; scale-out ≠ more TPM" | "SQL fails first at 100×" / "Scale-out removes 429" |
| WNTP → UI buyer-risk matrix (M-239/M-240) | "Ranked UI review vs WNTP rows; docs scanners ≠ UI coverage" | "Docs scanner green = UI safe" / lead with "SOC 2 certified" |
| Core Pilot happy-path (M-241/M-242) | "Authority → Finalize → in-app sponsor export" | "create→execute→commit default" / "empty dashboard = sponsor-ready" |
| Why-not-ChatGPT/Copilot (M-243/M-244) | "Seats draft / ArchLucid proves via package + evidence + audit" | "Always beats frontier AI" / "Cheaper than Copilot seats" |
| Elevator pitch V1 claim audit (M-245/M-246) | "Cut/hedge/prove with committed run only" | "Two weeks → two hours" / "Gates always on" |
| AgentTask→decisioning leak seams (M-247/M-248) | "Mode-blind residual matrix; schema ≠ provenance" | "Simulator decide fail-closed differently" / "Schema gate = typed gate" |
| TB-881 ship-blocker class (M-249/M-250) | "CI/test Done; pilots sequential; signup-stress residual" | "TB-881 blocks pilots" / "Reopen TB-881 for V1" |
| Specialty help chrome ≤~50 (M-251/M-252) | "Shared chrome once; per-slug clusters apply" | "All help is specialty-guided" / "TB-735 gates all technical help" |
| INV-001 / decide-once / committed triad (M-253/M-254) | "Separately bounded invariants; committed = identity + hash lineage" | "Decide-once = package truth" / "Triad closed / crypto-isolated" |
| DiD structural vs convention (M-255/M-256) | "Layer A structural; B/C/Search DiD; D convention; RLS non-control" | "WHERE TenantId = boundary" / "RLS protects production" |
| Integration not-configured empty (M-257/M-258) | "StatusTag + one CTA + demote forms + no zero theater" | "Empty pages = integrations ready" / "Unified empty-state everywhere" |
| `/live-demo` vs `/see-it` ladder (M-259/M-260) | "Labeled 3-rung ladder; mode + universe pins" | "Live demo = live product" / "Offline = live API" |
| Bake-off 15-min loser sequence (M-261/M-262) | "Manual packaging loses first; LLM packaging/audit; EA out" | "EA lost the bake-off" / "Beats ChatGPT" / measured kill rates |
| Weekly buyer-claim drift (M-263/M-264) | "SEND vs REWRITE; clear C1–C6 before SEND" | "SEND with Critical drift" / "TB-135 still open eng" |
| GDPR erasure vs append-only (M-265/M-266) | "Sealed-in-life; Admin hard purge; residuals disclosed" | "Immutable forever" / "Complete erasure incl. Search" |
| Offline-verifiable export (M-267/M-268) | "Offline file SHA-256; lineage via live verify / saved receipt" | "Fully offline ManifestHash forever" / "PKI-signed packages" |
| Evidence backup/restore (M-269/M-270) | "Controlled discontinuity; external anchors distinguish" | "Append-only means backups can’t rewrite" / "SQL alone proves restore≠tamper" |
| Project soft-delete residue (M-271/M-272) | "Project row only; sealed evidence + audit remain" | "Delete project deletes all evidence" / "Purge = GDPR erasure" / "No trace" |
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
| Shared hallucination defense (M-211/M-212) | "One post-agent plane; mode varies thresholds/judges only; INV-002 labels" | "Simulator green = Real-safe" / "Forked Simulator vs Real defense stacks" |
| Demo/anonymous read plane (M-217/M-218) | "Tenant/system/demo planes; structural = factory/catalog or static-only" | "AllowAnonymous = safe" / "DemoScopes pin is structural" / "Empty demo = no data" |
| Decision-grade finding provenance (M-207/M-208) | "Structural ProvenanceKind + emission/commit gates; checklist exempt" | "All findings citation-bound" / "Prompt = fail-closed provenance" |
| Faithfulness / support-ratio lanes (M-209/M-210) | "Structural→commit; semantic/RAG→async; cohort→promotion" | "Faithfulness score = commit gate" / "PilotStrict = legal truth" / "Cohort ratio = package safety" |
| Tenant DiD erosion (M-213/M-214) | "Predicates erode; primary = Layer A + INV-001; analyzers ≠ proof" | "WHERE TenantId = isolation" / "NetArchTest proves tenancy" / "RLS is the fix" |
| Azure workload privilege seam (M-215/M-216) | "Bootstrap vs runtime SQL MI; AOAI User; PE ≠ least privilege" | "Prod API is non-db_owner" / "PE = private data plane" / "AOAI Contributor" |
| Dapper/DDL/satellite ladder (M-219/M-220) | "Intentional Dapper stack; measured ladder before ORM" | "EF fixes isolation/DENYs" / "Satellites = halfway to ORM" |
| Agent→decisioning Real-variance (M-203/M-204) | "Typed findings + sealed graph decide; proposals advisory until validate-before-overlay" | "Agent free text = signed package" / "PilotStrict green = Real overlays corruption-proof" |
| Golden-cohort re-lock vs rubber-stamp (M-201/M-202) | "Intentional re-lock OK with rationale; never-re-lockable list; 20/20 can still be a guard" | "Mass SHA rewrite = regression proof" / "Cohort re-lock heals production ManifestHash" |
| Dual hasher / projection evolution (M-198/M-199) | "Name hash surface; authority ManifestHash ≠ cohort content SHA; deliberate re-lock" | "Cohort SHA = production ManifestHash" / "Silent hasher change keeps historical verify green" |
| Post-strangler residual coupling (M-205/M-206) | "Hunt soft bridges; keep anti-resurrection pins until TB-1204; dual storage gone" | "Dual coordinator storage still ships" / "AgentTask verbs = dual repos" / "Delete DualPipeline tests because TB-919 complete" |
| Pilot trust without CPA/3P (M-190/M-191) | "Six-element Real SEND + labeled self-attested substitutes" | "Pilot bar requires CPA SOC 2 or published 3P pen test" |
| First security review ship order (M-192/M-193) | "Must: M-114 + M-151 + M-118; should M-124 if AI; defer M-171" | "Ready for security review = all PA one-pagers + CPA" |
| Isolation overclaim (M-194/M-195) | "Database-per-tenant + INV-001 + identity-wins (M-114); RLS non-control" | "SQL RLS is a production control" / "NetArchTest alone proves isolation" |
| SOC 2 / pen-test talk-track (M-196/M-197) | "Intent → evidence-type label → pack → defer with funding trigger" | "SOC 2 ready/almost" / "Pen test in flight" when only self-assessment exists |
| AOAI model retirement (M-273/M-274) | "Committed packages + stored-source replay survive; Real re-exec on retired pin does not" | "Bit-identical Real re-execution forever" / "Auto-upgrade preserves ManifestHash identity" |
| Configuration architecture (M-290/M-291) | "Layered IConfiguration; env wins over Advanced/SaaS; selective fail-fast; fragmented drift proof" | "appsettings is deployment SoT" / "TF state is CA config SoT" / "startup validates all config" / "IOptionsMonitor = prod hot-reload" / "TB-881 blocks pilots" |
| Mid-run authority revocation (M-282/M-283) | "New HTTP stops next authz boundary; in-flight + queued work eventual under tenant scope; API key fail-closed next request after reload" | "Revoke = instant global stop" / "SCIM disable instantly kills Entra JWT" / "Queued webhooks re-check architect" / "AuthVersion covers Entra" / "API keys cached after revoke" |
| Evidence/audit ordering & causality (M-284/M-285) | "Wall-clock `OccurredUtc` + `EventId` tie-break; app `TimeProvider` stamps; buyer UI may lifecycle-re-sort; append-only ≠ causal" | "DB sequence / insert order / Lamport causality" / "SQL `SYSUTCDATETIME` for all audit rows" / "Buyer UI timeline = forensic order" / "Append-only ⇒ causal / hash-chained rows" |
| Zero-downtime SQL migration (M-286/M-287) | "DbUp on API/Worker startup; consolidated SQL = reference + bootstrap; expand/contract discipline; bootstrap MI for DDL unless runtime split wired" | "Single SQL file is only apply path" / "Separate least-privilege CD migrator" / "Rolling deploy always ZDT" / "Prod API SQL is non-db_owner by default" / "Terraform applies schema" |
| REST+CLI breaking-change compatibility (M-288/M-289) | "Written ADR 0006 policy; `/v1` only; OpenAPI snapshot = accidental-drift gate; regen can still break `/v1`; Sunset headers default off; CLI no freeze" | "CI proves semver backward compat" / "Breaking always forces `/v2`" / "Sunset always on" / "CLI independently versioned" / "Swagger is contract of record" |
| Paying-tenant spend storm (M-294/M-295) | "Tenant gates fail-closed; metering ≠ Azure invoice; stolen key burns headroom" | "Metering reconciles to Azure invoice for disputes" / "Per-key spend isolation" |
| Shared TPM fairness (M-296/M-297) | "No cross-tenant TPM fair share; neighbor can drive 429/breaker" | "Fair shared AOAI TPM across tenants" |
| Customer policy-pack sandbox (M-298/M-299) | "Declarative in-process engine; pin at commit; tenant-local blast radius" | "WASM sandbox" / "Packs are certifications" / "Broken rule takes down all tenants" |
| Reasoning system (M-300/M-303/M-304) | "Evidence-supported inference; structural enforcement; held-out benchmark honesty; uncertainty ≠ pass" | "Hallucination-proof" / "Beats expert architects" / "Deterministic semantic verification" / non-held-out "benchmark" claims |

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
| A signed webhook or documented processing order is fully hardened against hostile internet traffic, replay, or denial of service. | The target intake order is rate → bounded size → verify → parse ([`INBOUND_WEBHOOK_HOSTILE_TRAFFIC.md`](INBOUND_WEBHOOK_HOSTILE_TRAFFIC.md), **TB-966** Done); bounded-body and ITSM replay completion remain **TB-967**–**TB-968**. |

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
| Customer content is injection-proof, the model cannot influence finding text, or every model influence path is eliminated. | The host composes model ingress and provides no model-driven HTTP, shell, or ITSM side-effect loop; production-like hosts fail closed on empty `AllowedTools` (**TB-950** Done); output can still influence findings. Engineering matrix: [`LLM_TRUST_BOUNDARY_INGRESS_CONFINEMENT_CONTRACT.md`](LLM_TRUST_BOUNDARY_INGRESS_CONFINEMENT_CONTRACT.md) (**TB-997**). Residual side-effect inventory: **TB-952**. |

#### M-150 — Tenant identity single derivation

| Do not promise | Do promise |
| --- | --- |
| `x-tenant-id` establishes production tenant identity, or Application/Persistence re-derive tenant scope from headers, JWTs, or `HttpContext`. | The host resolves typed `ScopeContext` once from trusted identity/ambient sources; production-like hosts reject header-only scope and lower layers consume the resolved context. Engineering matrix: [`TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md`](TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md) (**TB-999**). Follow-on honesty CI: **TB-1000**. |

**Batch A related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#prompt-injection-resistance-m-115`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#prompt-injection-resistance-m-115) (`PROMPT_INJECTION_RESISTANCE_BUYER_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-trust-boundary-ingress-m-149`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-trust-boundary-ingress-m-149) (`LLM_TRUST_BOUNDARY_INGRESS_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#security-reviewer-audit-trail-m-118`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#security-reviewer-audit-trail-m-118) (`SECURITY_REVIEWER_AUDIT_TRAIL_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#model-failed-vs-quality-rejected-m-124`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#model-failed-vs-quality-rejected-m-124) (`MODEL_FAILED_VS_QUALITY_REJECTED_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#quality-gate-versioning-m-130`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#quality-gate-versioning-m-130) (`QUALITY_GATE_VERSIONING_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-budget-reserve-settle-m-132`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-budget-reserve-settle-m-132) (`LLM_BUDGET_RESERVE_SETTLE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#finding-disposition-concurrency-m-141`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#finding-disposition-concurrency-m-141) (`FINDING_CONCURRENT_DISPOSITION_RACE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#empty-scope-catalog-routing-m-169`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#empty-scope-catalog-routing-m-169) (`EMPTY_SCOPE_CATALOG_ROUTING_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-identity-single-derivation-m-151`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-identity-single-derivation-m-151) (`TENANT_IDENTITY_SINGLE_DERIVATION_PA_ONE_PAGER.md` alias) · [this section’s parent table](#gtm-do-not-promise).

### PA claim-honesty bullets — Batch B {#pa-claim-honesty-bullets-batch-b}

Former standalone body: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_B.md` → this subsection (filename kept as a path-stable alias). Paste-ready GTM claim-boundary bullets for PA claim-honesty batch B (**M-138**–**M-188** even IDs) — not independent assurance attestations. Compressed one-line rows for the same M-* topics appear in the table above.

**Path-stable alias:** [`PA_CLAIM_HONESTY_BULLETS_BATCH_B.md`](../go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_B.md).

#### M-138 — Simulator-derived ROI/savings

| Do not promise | Do promise |
| --- | --- |
| Customer-realized $ from Simulator, demo, or HOLD baselines; “saved $X,” “customer ROI,” or “proven savings” from non-Real runs. | Execution mode ≠ ROI source; Simulator → illustrative estimate only; Real + COMPLETE baselines → estimated from tenant baselines with source label; external send requires Real + COMPLETE. Engineering matrix: [`SIMULATOR_ROI_SPONSOR_FORBID_CONTRACT.md`](SIMULATOR_ROI_SPONSOR_FORBID_CONTRACT.md) (**TB-983**). Follow-on enforcement: **TB-984**; honesty CI: **TB-985**. |

#### M-140 — Finding concurrent disposition

| Do not promise | Do promise |
| --- | --- |
| Finding approve/reject is mutually exclusive first-wins like the governance approval queue. | Dispositions are append-only (both persist; current = latest `OccurredAtUtc`); contract **TB-986** **Done**; approval-request CAS remains separate. |

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
| Polly retries + circuit breaker mean multi-agent runs always finish. | Transport resilience only; see engineering matrix [`POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md`](POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md) (**TB-995**). Partial-run / cache / mid-run budget residuals remain on **TB-941**–**TB-945** / **TB-975**–**TB-977**. |

#### M-152 — Retrieval tenancy

| Do not promise | Do promise |
| --- | --- |
| Dedicated Azure AI Search index per tenant or crypto-proof isolation from a Search hit. | Mandatory OData scope `$filter` + upsert scope validation + Graph-RAG expand from scoped snapshot; platform sentinel ≠ cross-tenant leak. Engineering matrix: [`RETRIEVAL_TENANCY_HIT_GUARANTEE_CONTRACT.md`](RETRIEVAL_TENANCY_HIT_GUARANTEE_CONTRACT.md) (**TB-1001**). Follow-on honesty CI: **TB-1002**. |

#### M-154 — Committed manifest unit of truth

| Do not promise | Do promise |
| --- | --- |
| Findings lists, Ask/RAG answers, drafts, uncommitted runs, Simulator output, or UI summaries are the signed finalized package or full Evidence→audit chain. | Only committed golden manifest (`GoldenManifestId` + `ManifestHash`) is unit of truth; label hop-skips (conversational / draft / illustrative / estimate). Engineering matrix: [`COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md`](COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) (**TB-1003**). Follow-on honesty CI: **TB-1004**. |

#### M-156 — Layer boundary / NetArchTest

| Do not promise | Do promise |
| --- | --- |
| Assembly/layer architecture tests alone prove multi-tenant isolation or make cross-tenant leaks impossible. | Compile-time DAG guards + Layer A catalogs + INV-001 + retrieval filters; name residual irreversible class (wrong catalog / unscoped path) and **TB-950** tool hole. Engineering matrix: [`LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md`](LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md) (**TB-1005**). Follow-on honesty CI: **TB-1006**. |

#### M-158 — Authority versus AgentTask loop

| Do not promise | Do promise |
| --- | --- |
| Every create requires `execute` before value; dual coordinator/authority storage still ships. | Authority pipeline canonical for new surfaces; `execute`/`result`/`commit` only when intentionally owning AgentTask semantics; forbid finishing an authority-finalized run via task loop. Engineering matrix: [`AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md`](AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md) (**TB-1007**). Follow-on honesty CI: **TB-1008**. |

#### M-160 — Append-only / sealed evidence

| Do not promise | Do promise |
| --- | --- |
| Editable audit log, in-place rewrite of commit-sealed findings/manifests, or platform-operated WORM. | Append-only `AuditEvents` + sealed evidence registry + hash/export verify; corrections append new events or enrichment overlay. Engineering matrix: [`APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md`](APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md) (**TB-1009**). Follow-on honesty CI: **TB-1010**. |

#### M-162 — Finalize versus outbox

| Do not promise | Do promise |
| --- | --- |
| Commit success means Search indexed, webhooks delivered, Cosmos projected, or every audit event is transactional. | Sealed package + durable **retrieval** outbox enqueue in finalize (ADR 0004); disclose integration `Try*` enqueue residual, Required vs informational audit, and delivery lag. Engineering matrix: [`TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md`](TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md) (**TB-1011**). Follow-on honesty CI: **TB-1012**. |

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
| Every policy pack blocks finalize; `priorityFloor` is a commit gate; packs are certifications; SoD requires a different committer; gate is always on. | Optional gate + enforcing assignment thresholds; Advisory/warn-only do not block; SoD = approval submitter≠approver (platform + org roles). Engineering matrix: [`PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_CONTRACT.md`](PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_CONTRACT.md) (**TB-1022**). Follow-on honesty CI: **TB-1023**. |

#### M-174 — Comparison/replay drift

| Do not promise | Do promise |
| --- | --- |
| Artifact-mode replay proves architecture unchanged; live mutable UI side-by-side equals verify. | Persisted `ComparisonRecord` + committed manifests on both sides; **verify** (422 on mismatch) for buyer drift/stable claims; label artifact-only as stored delta replay. Engineering matrix: [`COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md`](COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md) (**TB-1024**). Follow-on honesty CI: **TB-1025**. |

#### M-176 — Operator primary object

| Do not promise | Do promise |
| --- | --- |
| Findings or decisions are the hireable unit of truth; create and review are two equal products. | **Architecture package** as primary product noun; review = lifecycle; findings/decisions are children. Engineering matrix: [`OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_CONTRACT.md`](OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_CONTRACT.md) (**TB-1026**). Follow-on honesty CI: **TB-1027**. |

#### M-178 — `/see-it` static versus live boundary

| Do not promise | Do promise |
| --- | --- |
| Healthcare Claims sample while serving Contoso `demo/preview`; anonymous preview is tenant-accurate. | One universe per page + fail-closed mismatch; PA Q21 minimum = welcome→`/see-it`→CTA Option A or B. |

#### M-180 — First-15 / package-spine claims

| Do not promise | Do promise |
| --- | --- |
| “15 minutes without founder narration,” “product-led first value,” “no SE required,” or “won’t dismiss” without package spine + minute-12 checkpoint; absent **M-44** cohort as proof. | Finalize + sponsor export co-located on `/reviews/{runId}`; non-obvious finding + evidence → commit → unaided export as PA Q10 see list. Engineering matrix: [`PA_FIRST_15_PACKAGE_SPINE_IA_CONTRACT.md`](PA_FIRST_15_PACKAGE_SPINE_IA_CONTRACT.md) (**TB-1030**). |

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

**Batch B related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#simulator-roi-sponsor-forbid-m-139`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#simulator-roi-sponsor-forbid-m-139) (`SIMULATOR_ROI_SPONSOR_FORBID_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#retrieval-tenancy-hit-guarantee-m-153`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#retrieval-tenancy-hit-guarantee-m-153) (`RETRIEVAL_TENANCY_HIT_GUARANTEE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#authority-vs-agenttask-loop-m-159`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#authority-vs-agenttask-loop-m-159) (`AUTHORITY_VS_AGENTTASK_LOOP_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#append-only-sealed-evidence-m-161`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#append-only-sealed-evidence-m-161) (`APPEND_ONLY_SEALED_EVIDENCE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#transactional-finalize-vs-outbox-m-163`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#transactional-finalize-vs-outbox-m-163) (`TRANSACTIONAL_FINALIZE_VS_OUTBOX_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#outbox-replay-vs-idempotency-m-145`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#outbox-replay-vs-idempotency-m-145) (`TRANSACTIONAL_OUTBOX_REPLAY_IDEMPOTENCY_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#polly-vs-run-completeness-m-147`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#polly-vs-run-completeness-m-147) (`POLLY_VS_RUN_LEVEL_SURFACE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#solo-operator-pages-vs-support-email-m-143`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#solo-operator-pages-vs-support-email-m-143) (`SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#empty-scope-catalog-routing-m-169`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#empty-scope-catalog-routing-m-169) (`EMPTY_SCOPE_CATALOG_ROUTING_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#process-vs-provider-idempotency-m-171`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#process-vs-provider-idempotency-m-171) (`AGENT_TASK_PROCESS_VS_PROVIDER_IDEMPOTENCY_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#concurrent-execute-commit-race-m-222`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#concurrent-execute-commit-race-m-222) (`CONCURRENT_EXECUTE_AND_COMMIT_RACE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#manifest-content-schema-evolution-m-224`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#manifest-content-schema-evolution-m-224) (`MANIFEST_CONTENT_SCHEMA_EVOLUTION_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-cost-control-plane-m-226`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-cost-control-plane-m-226) (`LLM_COST_CONTROL_PLANE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#ft-promotion-decision-record-m-228`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#ft-promotion-decision-record-m-228) (`FINE_TUNING_PROMOTION_DECISION_RECORD_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#real-execute-aoai-throttle-m-230`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#real-execute-aoai-throttle-m-230) (`REAL_EXECUTE_AOAI_THROTTLE_POLICY_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#async-orchestration-first-force-m-232`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#async-orchestration-first-force-m-232) (`ASYNC_ORCHESTRATION_FIRST_FORCE_AND_RUN_STATE_MACHINE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#container-apps-terraform-authority-m-234`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#container-apps-terraform-authority-m-234) (`CONTAINER_APPS_TERRAFORM_AUTHORITY_AND_DRIFT_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#policy-pack-evaluation-hybrid-m-236`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#policy-pack-evaluation-hybrid-m-236) (`POLICY_PACK_EVALUATION_COMPILED_VS_DATA_PLANE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#review-volume-100x-capacity-m-238`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#review-volume-100x-capacity-m-238) (`REVIEW_VOLUME_100X_FAILURE_ORDER_AND_OPTION_PRESERVING_CAPACITY_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#wntp-ui-buyer-risk-matrix-m-240`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#wntp-ui-buyer-risk-matrix-m-240) (`WHAT_NOT_TO_PROMISE_UI_BUYER_RISK_MATRIX_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#core-pilot-happy-path-m-242`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#core-pilot-happy-path-m-242) (`CORE_PILOT_HAPPY_PATH_STICK_AND_EMPTY_STATE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#why-not-chatgpt-copilot-m-244`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#why-not-chatgpt-copilot-m-244) (`WHY_NOT_CHATGPT_COPILOT_2MIN_LIVE_ANCHORS_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#elevator-pitch-v1-claim-audit-m-246`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#elevator-pitch-v1-claim-audit-m-246) (`ELEVATOR_PITCH_V1_CLAIM_AUDIT_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#agenttask-decisioning-ungated-leak-seams-m-248`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#agenttask-decisioning-ungated-leak-seams-m-248) (`AGENTTASK_DECISIONING_UNGATED_LEAK_SEAMS_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tb881-org-registration-race-ship-blocker-m-250`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tb881-org-registration-race-ship-blocker-m-250) (`TB881_ORG_REGISTRATION_RACE_SHIP_BLOCKER_CLASSIFICATION_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#owner-screenshot-below-50-specialty-help-chrome-m-252`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#owner-screenshot-below-50-specialty-help-chrome-m-252) (`OWNER_SCREENSHOT_BELOW_50_SPECIALTY_HELP_CHROME_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#inv001-decide-once-committed-manifest-triad-m-254`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#inv001-decide-once-committed-manifest-triad-m-254) (`INV001_DECIDE_ONCE_COMMITTED_MANIFEST_PA_TRIAD_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-structural-vs-convention-m-256`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-structural-vs-convention-m-256) (`TENANT_ISOLATION_STRUCTURAL_VS_CONVENTION_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#integration-not-configured-empty-state-m-258`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#integration-not-configured-empty-state-m-258) (`INTEGRATION_NOT_CONFIGURED_EMPTY_STATE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#live-demo-see-it-ladder-m-260`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#live-demo-see-it-ladder-m-260) (`LIVE_DEMO_SEE_IT_LADDER_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#bakeoff-15min-loser-sequence-m-262`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#bakeoff-15min-loser-sequence-m-262) (`BAKEOFF_15MIN_LOSER_SEQUENCE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#weekly-buyer-claim-drift-m-264`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#weekly-buyer-claim-drift-m-264) (`WEEKLY_BUYER_CLAIM_DRIFT_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#gdpr-erasure-vs-append-only-m-266`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#gdpr-erasure-vs-append-only-m-266) (`GDPR_ERASURE_VS_APPEND_ONLY_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#offline-verifiable-export-portability-m-268`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#offline-verifiable-export-portability-m-268) (`OFFLINE_VERIFIABLE_EXPORT_PORTABILITY_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#evidence-backup-restore-invariant-m-270`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#evidence-backup-restore-invariant-m-270) (`EVIDENCE_BACKUP_RESTORE_INVARIANT_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#project-soft-delete-sealed-evidence-m-272`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#project-soft-delete-sealed-evidence-m-272) (`PROJECT_SOFT_DELETE_SEALED_EVIDENCE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#aoai-model-retirement-repro-m-274`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#aoai-model-retirement-repro-m-274) (`AOAI_MODEL_RETIREMENT_REPRO_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#paying-tenant-llm-spend-storm-m-295`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#paying-tenant-llm-spend-storm-m-295) (`PAYING_TENANT_LLM_SPEND_STORM_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#shared-aoai-tpm-noisy-neighbor-m-297`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#shared-aoai-tpm-noisy-neighbor-m-297) (`SHARED_AOAI_TPM_NOISY_NEIGHBOR_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#policy-pack-customer-rule-sandbox-m-299`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#policy-pack-customer-rule-sandbox-m-299) (`POLICY_PACK_CUSTOMER_RULE_SANDBOX_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#launch-load-failure-order-m-183`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#launch-load-failure-order-m-183) (`LAUNCH_LOAD_FAILURE_ORDER_DEGRADATION_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#marketing-static-vs-live-demo-boundary-m-179`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#marketing-static-vs-live-demo-boundary-m-179) (`MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#strangler-next-slice-result-sunset-m-185`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#strangler-next-slice-result-sunset-m-185) (`STRANGLER_NEXT_SLICE_RESULT_SUNSET_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#competitive-deal-loss-closing-evidence-m-187`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#competitive-deal-loss-closing-evidence-m-187) (`COMPETITIVE_DEAL_LOSS_CLOSING_EVIDENCE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#stage-0-claim-allowlist-vs-oversell-m-189`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#stage-0-claim-allowlist-vs-oversell-m-189) (`STAGE_0_CLAIM_ALLOWLIST_VS_OVERSELL_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#layer-boundary-irreversible-leak-m-157`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#layer-boundary-irreversible-leak-m-157) (`LAYER_BOUNDARY_IRREVERSIBLE_LEAK_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#comparison-replay-immutable-snapshot-m-175`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#comparison-replay-immutable-snapshot-m-175) (`COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#pa-first-15-package-spine-ia-m-181`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#pa-first-15-package-spine-ia-m-181) (`PA_FIRST_15_PACKAGE_SPINE_IA_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#shared-hallucination-defense-plane-m-212`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#shared-hallucination-defense-plane-m-212) (`SHARED_HALLUCINATION_DEFENSE_PLANE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#demo-anonymous-read-plane-m-218`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#demo-anonymous-read-plane-m-218) (`DEMO_ANONYMOUS_READ_PLANE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#decision-grade-finding-provenance-m-208`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#decision-grade-finding-provenance-m-208) (`DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#faithfulness-support-ratio-scoring-lanes-m-210`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#faithfulness-support-ratio-scoring-lanes-m-210) (`FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-did-erosion-beyond-predicates-m-214`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-did-erosion-beyond-predicates-m-214) (`TENANT_DID_EROSION_BEYOND_PREDICATES_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-workload-privilege-escalation-seam-m-216`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-workload-privilege-escalation-seam-m-216) (`AZURE_WORKLOAD_PRIVILEGE_ESCALATION_SEAM_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#dapper-ddl-satellite-breakdown-m-220`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#dapper-ddl-satellite-breakdown-m-220) (`DAPPER_DDL_SATELLITE_BREAKDOWN_SIGNALS_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#agent-output-decisioning-real-variance-m-204`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#agent-output-decisioning-real-variance-m-204) (`AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#golden-cohort-relock-vs-rubber-stamp-m-202`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#golden-cohort-relock-vs-rubber-stamp-m-202) (`GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#manifest-dual-hasher-projection-evolution-m-199`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#manifest-dual-hasher-projection-evolution-m-199) (`MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#post-strangler-residual-coupling-m-206`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#post-strangler-residual-coupling-m-206) (`POST_STRANGLER_RESIDUAL_COUPLING_DISCIPLINE_TEST_RETIREMENT_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#architecture-reasoning-system-m-300`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#architecture-reasoning-system-m-300) (`ARCHITECTURE_REASONING_SYSTEM_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#pre-finalize-gate-sod-m-173`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#pre-finalize-gate-sod-m-173) (`PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#read-after-write-client-m-165`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#read-after-write-client-m-165) (`READ_AFTER_WRITE_CLIENT_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#pilotstrict-vs-execution-mode-m-167`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#pilotstrict-vs-execution-mode-m-167) (`PILOTSTRICT_VS_EXECUTION_MODE_PA_ONE_PAGER.md` alias) · [`BUYER_SECURITY_PROCUREMENT_PACKET.md#operator-primary-object-nav-collapse-m-177`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#operator-primary-object-nav-collapse-m-177) (`OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_PA_ONE_PAGER.md` alias) · [this section’s parent table](#gtm-do-not-promise).

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
| **M-290** | Configuration architecture | Do not sell appsettings/TF-state as SoT, universal ValidateOnStart, IOptionsMonitor hot-reload, or drift preflight as live parity; do not reopen Done **TB-881** as a pilot gate. | Promise layered precedence (env over overlays), selective fail-fast, drift class honesty, and Done **TB-881** = CI/test isolation. Engineering map: [`CONFIGURATION_ARCHITECTURE_PRECEDENCE_VALIDATION_DRIFT_CLAIM_MAP.md`](CONFIGURATION_ARCHITECTURE_PRECEDENCE_VALIDATION_DRIFT_CLAIM_MAP.md) (**TB-1561**). Follow-on honesty CI: **TB-1562**. |
| **M-282** | Mid-run authority revocation | Do not sell instant global stop on revoke, SCIM `Active=false` as instant Entra role strip, queued ITSM/webhook principal re-check, AuthVersion on Entra tokens, or long API-key validation cache after revoke. | Promise structural stop on **new HTTP** and next API-key authenticate; eventual in-flight + queued tenant-scoped work; Entra JWT until expiry. Engineering map: [`MID_RUN_AUTHORITY_REVOCATION_CLAIM_MAP.md`](MID_RUN_AUTHORITY_REVOCATION_CLAIM_MAP.md) (**TB-1537**). Follow-on honesty CI: **TB-1538**. |
| **M-284** | Evidence/audit ordering & causality | Do not sell DB sequence/insert-order/Lamport causality, SQL `SYSUTCDATETIME` for all tenant audit rows, retry-safe perceived order, buyer UI as forensic chronology, or append-only/immutability as causal/hash-chained audit rows. | Promise best-effort wall-clock `OccurredUtc` + `EventId` tie-break, app `TimeProvider` stamps, disclosed lifecycle re-sort, and orthogonal seal/export hash (ADR 0040). Engineering map: [`EVIDENCE_AUDIT_ORDERING_CAUSALITY_CLAIM_MAP.md`](EVIDENCE_AUDIT_ORDERING_CAUSALITY_CLAIM_MAP.md) (**TB-1550**). Follow-on honesty CI: **TB-1551**. |
| **M-286** | Zero-downtime SQL migration | Do not sell consolidated SQL as the only production apply path, a separate least-privilege CD/SQL migrator job, automatic rolling ZDT for all DDL, production non-`db_owner` API SQL by default, DbUp down migrations, or Terraform schema apply. | Promise in-process DbUp on API/Worker startup, expand/contract discipline + **TB-068** lint, bootstrap MI reality, and forward-only rollback posture. Engineering map: [`ZERO_DOWNTIME_SQL_MIGRATION_CLAIM_MAP.md`](ZERO_DOWNTIME_SQL_MIGRATION_CLAIM_MAP.md) (**TB-1557**). Follow-on honesty CI: **TB-1558**. |
| **M-288** | REST+CLI breaking-change compatibility | Do not sell CI as semantic semver proof, machine-enforced `/v2` for all breaks, always-on Sunset/Deprecation headers, dual REST majors in prod, independent CLI semver freeze, or Swashbuckle as contract of record. | Promise ADR 0006 written policy, `/v1` only, OpenAPI exact-snapshot accidental-drift gate + codegen sync, human review on intentional regen, and pilot-first-class lifecycle routes + `archlucid` CLI. Engineering map: [`REST_CLI_BREAKING_CHANGE_COMPATIBILITY_CLAIM_MAP.md`](REST_CLI_BREAKING_CHANGE_COMPATIBILITY_CLAIM_MAP.md) (**TB-1559**). Follow-on honesty CI: **TB-1560**. |
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
- Claim maps: [`configuration architecture`](CONFIGURATION_ARCHITECTURE_PRECEDENCE_VALIDATION_DRIFT_CLAIM_MAP.md), [`mid-run authority revocation`](MID_RUN_AUTHORITY_REVOCATION_CLAIM_MAP.md), [`evidence/audit ordering`](EVIDENCE_AUDIT_ORDERING_CAUSALITY_CLAIM_MAP.md), [`zero-downtime SQL migration`](ZERO_DOWNTIME_SQL_MIGRATION_CLAIM_MAP.md), [`REST+CLI breaking-change compatibility`](REST_CLI_BREAKING_CHANGE_COMPATIBILITY_CLAIM_MAP.md), [`AOAI model retirement`](AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md), [`paying-tenant spend`](PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md), [`shared AOAI TPM`](SHARED_AOAI_TPM_NOISY_NEIGHBOR_FAIRNESS_CLAIM_MAP.md), and [`policy-pack sandbox`](POLICY_PACK_CUSTOMER_RULE_SANDBOX_PIN_BLAST_RADIUS_CLAIM_MAP.md).
- [GTM do-not-promise table](#gtm-do-not-promise) (formerly `WHAT_NOT_TO_PROMISE.md`).

### Canonical deferral docs

- [`V1_SCOPE.md`](V1_SCOPE.md) §3
- [`../go-to-market/trust-center.md`](../go-to-market/trust-center.md)
- [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)

Former standalone: `docs/go-to-market/WHAT_NOT_TO_PROMISE.md` → this section.  
Former standalone: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_A.md` → [`#pa-claim-honesty-bullets-batch-a`](#pa-claim-honesty-bullets-batch-a).  
Former standalone: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_B.md` → [`#pa-claim-honesty-bullets-batch-b`](#pa-claim-honesty-bullets-batch-b).  
Former standalone: `docs/go-to-market/PA_CLAIM_HONESTY_BULLETS_BATCH_C.md` → [`#pa-claim-honesty-bullets-batch-c`](#pa-claim-honesty-bullets-batch-c).

## Proof-scope boundary {#proof-scope-boundary}

The category name **Architecture Proof Engine** is deliberately provocative; the canonical answer to "proof of what?" lives in [POSITIONING.md §5 "What proof means here"](../go-to-market/POSITIONING.md#what-proof-means-here). Quote it verbatim — do not improvise a broader proof claim.

**Allowed proof vocabulary** (maps to shipped V1 capabilities):

- Proof of **review rigor and diligence** — an evidence-linked review happened, with findings, confidence limits, and explicit non-conclusions
- **Evidence linkage / provenance** — every finding traces to what it used (audit chain, `ExplainabilityTrace`)
- **Auditability** — append-only typed audit events
- **Tamper evidence** — the finalized package is hash-verified ("signed" = manifest-level hash verification, never a PKI certificate claim)
- **Defensibility of the decision** — the package can be shown to a sponsor, auditor, or design authority

**Forbidden without explicit qualification** — never state or imply that ArchLucid proves, validates, or guarantees:

- architecture **soundness**, correctness, or resilience of the reviewed system
- **production readiness** or **runtime performance** (load behavior, scale, latency)
- the **security posture of the reviewed system** (findings are review inputs, not attestation)
- **incident resilience** or operational outcomes

When the buyer objection is "proof means it survived load/audit/incident", the safe frame is **proof of diligence vs. no record**: the alternative to ArchLucid is not runtime validation — it is an undocumented review with no durable evidence. See [`DIFFERENTIATION_PROOF_PACKET.md`](../go-to-market/DIFFERENTIATION_PROOF_PACKET.md).

### Review record integrity (R2)

| Topic | Safe wording | Do not promise |
| --- | --- | --- |
| Signed review record | "Committed golden manifest with hash verification and append-only audit" | "Editable audit log" or "PKI-signed certificate" |
| Ask / impact preview overlays | "Advisory analysis on top of a finalized package" | "Ask answer replaces the signed package" |
| Cross-review finding match | "Correlation when policy rule or fingerprint aligns" | "Same finding id across runs means identical disposition" |

Authoritative buyer doc: [`REVIEW_RECORD_INTEGRITY.md`](customer-facing/REVIEW_RECORD_INTEGRITY.md).

**CI:** `scripts/ci/check_buyer_claim_drift.py` blocks unscoped soundness-proof phrasing in the allowlisted buyer-facing doc set (remediation messages point here).

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
