> **Reviewed:** 2026-07-28

>

> **Scope:** Proposed paste-ready GTM claim-boundary bullets for PA claim-honesty batch B (M-138–M-188 even IDs). These rows are not independent assurance attestations.



# PA claim-honesty bullets — Batch B



## M-138 — Simulator-derived ROI/savings



| Do not promise | Do promise |

| --- | --- |

| Customer-realized $ from Simulator, demo, or HOLD baselines; “saved $X,” “customer ROI,” or “proven savings” from non-Real runs. | Execution mode ≠ ROI source; Simulator → illustrative estimate only; Real + COMPLETE baselines → estimated from tenant baselines with source label; external send requires Real + COMPLETE. |



## M-140 — Finding concurrent disposition



| Do not promise | Do promise |

| --- | --- |

| Finding approve/reject is mutually exclusive first-wins like the governance approval queue. | Dispositions are append-only (both persist; current = latest by time) unless **TB-986** option B ships a mutex; approval-request CAS claims remain separate. |



## M-142 — Solo-ops single-tenant miss



| Do not promise | Do promise |

| --- | --- |

| Every tenant-affecting failure pages the founder before a support ticket; fleet MVO P0s equal per-tenant stuck-run coverage. | Fleet P0 monitoring when enabled; per-tenant stuck-run and review-path canary remain open under **TB-958**/**TB-959**; Report Problem is inbox-by-design. |



## M-144 — Outbox at-least-once delivery



| Do not promise | Do promise |

| --- | --- |

| Exactly-once integration events or side effects; Service Bus duplicate detection as permanent dedupe. | At-least-once publish with replay after crash before `MarkProcessed`; short SB duplicate window; consumers must be idempotent. |



## M-146 — Polly versus run completeness



| Do not promise | Do promise |

| --- | --- |

| Polly retries + circuit breaker mean multi-agent runs always finish. | Transport resilience only; partial-run, cache, and mid-run budget semantics remain separate (**TB-937**–**TB-945**). |



## M-152 — Retrieval tenancy



| Do not promise | Do promise |

| --- | --- |

| Dedicated Azure AI Search index per tenant or crypto-proof isolation from a Search hit. | Mandatory OData scope `$filter` + upsert scope validation + Graph-RAG expand from scoped snapshot; platform sentinel ≠ cross-tenant leak. |



## M-154 — Committed manifest unit of truth



| Do not promise | Do promise |

| --- | --- |

| Findings lists, Ask/RAG answers, drafts, uncommitted runs, Simulator output, or UI summaries are the signed finalized package or full Evidence→audit chain. | Only committed golden manifest (`GoldenManifestId` + `ManifestHash`) is unit of truth; label hop-skips (conversational / draft / illustrative / estimate). |



## M-156 — Layer boundary / NetArchTest



| Do not promise | Do promise |

| --- | --- |

| Assembly/layer architecture tests alone prove multi-tenant isolation or make cross-tenant leaks impossible. | Compile-time DAG guards + Layer A catalogs + INV-001 + retrieval filters; name residual irreversible class (wrong catalog / unscoped path) and **TB-950** tool hole. |



## M-158 — Authority versus AgentTask loop



| Do not promise | Do promise |

| --- | --- |

| Every create requires `execute` before value; dual coordinator/authority storage still ships. | Authority pipeline canonical for new surfaces; `execute`/`result`/`commit` only when intentionally owning AgentTask semantics; forbid finishing an authority-finalized run via task loop. |



## M-160 — Append-only / sealed evidence



| Do not promise | Do promise |

| --- | --- |

| Editable audit log, in-place rewrite of commit-sealed findings/manifests, or platform-operated WORM. | Append-only `AuditEvents` + sealed evidence registry + hash/export verify; corrections append new events or enrichment overlay. |



## M-162 — Finalize versus outbox



| Do not promise | Do promise |

| --- | --- |

| Commit success means Search indexed, webhooks delivered, Cosmos projected, or every audit event is transactional. | Sealed package + durable outbox enqueue in finalize; disclose Required vs informational audit and delivery lag. |



## M-164 — Read-after-write



| Do not promise | Do promise |

| --- | --- |

| Create returns a review-ready package; commit success makes Ask/Search/ITSM immediately consistent. | Poll/SSE until golden manifest; disclose outbox and replica lag; name the readiness signal per consumer. |



## M-166 — PilotStrict ≠ Real



| Do not promise | Do promise |

| --- | --- |

| PilotStrict / AI-readiness pass means live-model sponsor proof; omit Simulator/Fallback/Mixed when quality gates are green. | Execution mode on every sponsor export; Real (or labeled curated sample) before external PDF; quality pass and mode are orthogonal. |



## M-168 — Empty-scope catalog routing



| Do not promise | Do promise |

| --- | --- |

| Database-per-tenant makes unscoped queries safe; empty TenantId returns no data; SQL RLS protects production. | Typed scope for product SQL; disclose Empty→system catalog and SingleCatalog predicate-only risk. |



## M-170 — Process versus provider LLM billing



| Do not promise | Do promise |

| --- | --- |

| Exactly-once LLM or zero duplicate spend on retry/interrupt. | Process skip only for persisted successful `(RunId, TaskId)`; disclose provider at-least-once billing. |



## M-172 — Pre-finalize gate and SoD



| Do not promise | Do promise |

| --- | --- |

| Every policy pack blocks finalize; `priorityFloor` is a commit gate; packs are certifications; SoD requires a different committer; gate is always on. | Optional gate + enforcing assignment thresholds; Advisory/warn-only do not block; SoD = approval submitter≠approver (platform + org roles). |



## M-174 — Comparison/replay drift



| Do not promise | Do promise |

| --- | --- |

| Artifact-mode replay proves architecture unchanged; live mutable UI side-by-side equals verify. | Persisted `ComparisonRecord` + committed manifests on both sides; **verify** (422 on mismatch) for buyer drift/stable claims; label artifact-only as stored delta replay. |



## M-176 — Operator primary object



| Do not promise | Do promise |

| --- | --- |

| Findings or decisions are the hireable unit of truth; create and review are two equal products. | **Architecture package** as primary product noun; review = lifecycle; findings/decisions are children. |



## M-178 — `/see-it` static versus live boundary



| Do not promise | Do promise |

| --- | --- |

| Healthcare Claims sample while serving Contoso `demo/preview`; anonymous preview is tenant-accurate. | One universe per page + fail-closed mismatch; PA Q21 minimum = welcome→`/see-it`→CTA Option A or B. |



## M-180 — First-15 / package-spine claims



| Do not promise | Do promise |

| --- | --- |

| “15 minutes without founder narration,” “product-led first value,” “no SE required,” or “won’t dismiss” without package spine + minute-12 checkpoint; absent **M-44** cohort as proof. | Finalize + sponsor export co-located on `/reviews/{runId}`; non-obvious finding + evidence → commit → unaided export as PA Q10 see list. |



## M-182 — Launch-load failure order



| Do not promise | Do promise |

| --- | --- |

| API scale-out removes AOAI 429/TPM limits; launch load “proven” while drill pending; outbox lag loses committed packages or is first sync admit failure under burst. | HTTP-first launch vs AOAI-ceiling Real execute; committed packages durable; worker lag affects projections, not finalize record. |



## M-184 — Strangler next slice



| Do not promise | Do promise |

| --- | --- |

| Create→execute→commit as default peer lifecycle to Authority; dual coordinator storage still ships; `POST …/result` finalizes/commits. | Authority product-default freeze + AgentTask extension-loop rename + `/result` sunset per owner ADR. |



## M-186 — Competitive deal loss



| Do not promise | Do promise |

| --- | --- |

| Measured win/loss frequency without **M-20**; ArchLucid replaces Confluence/Miro/ServiceNow/GRC; primary differentiation as Visio bakeoff; cheaper TCO than Copilot seats. | Hypothesis: status-quo manual packaging kills most often; close with committed package + evidence refs + mode-labeled export; pivot = seats draft / ArchLucid proves. |



## M-188 — Stage 0 allowlist versus oversell



| Do not promise | Do promise |

| --- | --- |

| Stage 1 “evidence-backed selling,” “proven across N pilots,” unlabeled/Simulator-as-production AI, guaranteed $, SOC 2 certified, Marketplace buy today, or named references while Stage 0 and G4 HOLD. | Allowlist: committed package + mode label + evidence-linked findings + mode-labeled export + source-classified ROI + trust honesty. |



**Related:** [`PA_CLAIM_HONESTY_INDEX.md`](PA_CLAIM_HONESTY_INDEX.md) · [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#pa-claim-honesty-bullets-batch-a`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#pa-claim-honesty-bullets-batch-a) (`PA_CLAIM_HONESTY_BULLETS_BATCH_A.md` alias) · [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).


