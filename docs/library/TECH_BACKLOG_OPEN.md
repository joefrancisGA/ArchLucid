> **Scope:** Contributor-reference — verified **open** items extracted from the main tech backlog; not a buyer or operator document.

# Tech backlog — verified open items

> **Updated:** 2026-07-25 (enriched **TB-1028**–**TB-1029** — PA Q21 minimum funnel fix: `/see-it` Option A or B end-to-end; Northwind off-funnel; no new IDs; GTM **M-178**/**M-107**/**M-134**). Prior: 2026-07-25 (added **TB-1036**–**TB-1039** — P0 operator Overview empty-state UX: next-best-action, zero-theater suppress, Do-this-next card, demo→sample package; owner screenshot 2026-07-25). Prior: 2026-07-25 (added **TB-1034**–**TB-1035** — PA Q20 strangler next slice: Authority product-default freeze + `POST …/result` sunset ADR + honesty CI; GTM **M-184**/**M-185**; complements **TB-1007** / Done **TB-919**). Prior: 2026-07-25 (added **TB-1032**–**TB-1033** — PA Q19 launch-load failure order + graceful degradation matrix + honesty CI; GTM **M-182**/**M-183**; complements **G-SCALE-01**/**G-SCALE-02** / **TB-915**/**TB-905**). Prior: 2026-07-25 (added **TB-1030**–**TB-1031** — PA Q18 first-15 completion + narration-free package-spine IA unlock + honesty CI; GTM **M-180**/**M-181**; does not reopen **M-44**/**M-47**/**M-48**). Prior: 2026-07-25 (added **TB-1028**–**TB-1029** — PA `/see-it` static vs anonymous-live vs tenant boundary + Contoso≠Claims fail-closed + honesty CI; GTM **M-178**/**M-179**). Prior: 2026-07-25 (added **TB-1026**–**TB-1027** — PA operator primary-object hierarchy + nav/route collapse matrix + honesty CI; GTM **M-176**/**M-177**). Prior: 2026-07-25 (enriched **TB-978**–**TB-982** — PA Q15 sample-package universe+ID alignment for showcase/static vs SQL/trial/marketing; no new IDs; GTM **M-133**/**M-134**; cluster row restored below). Prior: 2026-07-25 (added **TB-1024**–**TB-1025** — PA comparison/replay minimal immutable snapshot + real drift vs UI illusion + honesty CI; GTM **M-174**/**M-175**). Prior: 2026-07-25 (added **TB-1022**–**TB-1023** — PA pre-finalize gate block vs advisory + SoD ownership matrix + honesty CI; GTM **M-172**/**M-173**). Prior: 2026-07-25 (enriched **TB-1003**–**TB-1004** — PA Evidence→…→audit chain hop-skip + honest labels; no new IDs; GTM **M-154**/**M-155**). Prior: 2026-07-25 (added **TB-1020**–**TB-1021** — PA process vs provider `(RunId, TaskId)` idempotency + LLM billing contract + honesty CI; GTM **M-170**/**M-171**). Prior: 2026-07-25 (added **TB-1018**–**TB-1019** — PA empty/untyped-scope catalog-routing failure matrix + honesty CI; GTM **M-168**/**M-169**). Prior: 2026-07-25 (added **TB-1015**–**TB-1017** — PA PilotStrict ≠ Real / Simulator disclosure end-to-end contract + enforce + honesty CI; GTM **M-166**/**M-167**). Prior: 2026-07-25 (added **TB-1013**–**TB-1014** — PA read-after-write under async authority + outbox client/UI readiness contract + honesty CI; GTM **M-164**/**M-165**). Prior: 2026-07-24 (added **TB-1011**–**TB-1012** — PA transactional finalize vs outbox/async + never-silent-best-effort matrix + honesty CI; GTM **M-162**/**M-163**). Prior: 2026-07-24 (added **TB-1009**–**TB-1010** — append-only / sealed evidence; GTM **M-160**/**M-161**). Prior: 2026-07-24 (added **TB-1007**–**TB-1008** — Authority vs AgentTask; GTM **M-158**/**M-159**). Prior: 2026-07-24 (added **TB-1005**–**TB-1006** — layer residual; GTM **M-156**/**M-157**). Prior: 2026-07-24 (added **TB-1001**–**TB-1004** / **TB-999**–**TB-1000** PA tenancy/manifest/INV-001 clusters). Prior: 2026-07-22 (**TB-936**, **TB-929**–**TB-932**). Prior: 2026-07-19 (**TB-892**–**TB-902**, **TB-887**–**TB-891**, **TB-135**/**TB-136** closed tech, **TB-874**–**TB-877**).

## Ordering convention

In `TECH_BACKLOG.md` summary table: **V1 / V1.1 first** (cluster order); **`### V2 window` last**. Do **not** renumber TB IDs when changing window — stable IDs preserve assessment/grep history. `/ship-next-improvement` and `/show-all-improvements` already **skip `**V2**`** in the shippable queue; the bottom placement is belt-and-suspenders for file-order scans.

## Recently closed (do not re-open)

| Cluster | IDs |
| --- | --- |
| TECH_BACKLOG archive hygiene | **TB-673** (Done 2026-07-19) |
| V1.1 assurance program tracking (tech) | **TB-135**, **TB-136** (Done 2026-07-19 — tech tracking closed); owner work still open in GTM **G-REAL-05** / **G-ASSURANCE-02** |
| GTM-only rows removed from TECH_BACKLOG | **TB-141**, **TB-142**, **TB-164**, **TB-236** (wave 1); **TB-161**–**TB-163**, **TB-640** (wave 2); **TB-135**–**TB-140**, **TB-158**–**TB-160** (wave 3) |

## Open clusters (summary rows — see `TECH_BACKLOG.md`)

| Cluster | IDs | Summary |
| --- | --- | --- |
| Multi-cloud analysis §2.19 remainder | **TB-874** – **TB-876** (open P1) | AWS/GCP analysis-path parity |
| Community summarization Graph-RAG | **TB-877** (open P1) | RAG-V2-001 remainder — ADR 0057 (a) |
| Promoted RAG remainders | **TB-878** – **TB-880**, **TB-686** (open P2 **V1**) | Retry loop; pilot-feedback retrieval; pattern library; semantic chunking |
| AI model chooser | **TB-872** open (**TB-869**–**TB-871** Done) | Customer Azure OpenAI BYO |
| RC12 release-candidate blocker | **TB-881** (open P1, **RC12** window, not V1/V1.1/V2) | Duplicate-organization registration conflict regression — env-var race hypothesis |
| Tier 3 hold (assessment) | **TB-882**–**TB-886** (open; **Hold for reassessment**) | Nav guard; Graph-RAG live ablation; pack attribution; compounding ledger; manifest-verify docs |
| Public showcase (`claims-intake-modernization`) | **TB-887**–**TB-890** **Done**; **TB-891** open P1 **V1** | Static-first / disclosure / prod smoke / QuickNav Done; telemetry + **TB-978** scenario dimension still open — assessment 2026-07-19 |
| Showcase scenario portfolio (Option D) | **TB-978**–**TB-982** (open P1/P2 **V1**) | Sample-definition packages + default flip + trial/marketing universe+ID alignment (PA Q15 enriched); GTM **M-133**–**M-137** |
| Anonymous Quick Scan public safety | **TB-892**–**TB-902** (open P0/P1 **V1**) | Config → pricing → global budgets → anonymous endpoint → concurrency → abuse → kill switch → telemetry → sample UX → adversarial → release gate; assessment **SAFE TO EXPOSE: NO** until **TB-902** |
| JSON payload-shape (H2 remainder) | **TB-929**–**TB-931** open P1/P2 **V1**; **TB-932** **V2** | List `*Json` projection audit; run-detail lazy-load; typed scalars; blob offload when measured |
| Alerts Conditions tab UX | **TB-936** (open P0 **V1**) | `/governance/alert-rules?tab=rules` — rule builder, terminology, preview, sample guards |
| Polly vs run-level matrix (PA Q7) | **TB-995**–**TB-996** (open P1 **V1**) | Transport vs run-level surface matrix + honesty CI; GTM **M-146**/**M-147** |
| LLM trust boundary (PA Q11) | **TB-997**–**TB-998** (open P1 **V1**) | Ingress vs structurally-impossible matrix + honesty CI; GTM **M-148**/**M-149** |
| INV-001 single-derivation (PA Q1) | **TB-999**–**TB-1000** (open P1 **V1**) | Host-boundary decide-once vs forbidden-layer matrix + honesty CI; GTM **M-150**/**M-151**; complements Done **TB-010**/**TB-304**/**TB-925** / ARCH001 |
| Ask/Search/Graph-RAG tenancy (PA Q3) | **TB-1001**–**TB-1002** (open P1 **V1**) | Retrieval hit guarantee matrix + honesty CI; GTM **M-152**/**M-153**; Done **TB-048**/**TB-071**/**TB-604** |
| Committed golden manifest unit-of-truth + Evidence→…→audit hops | **TB-1003**–**TB-1004** (open P1 **V1**) | Unit-of-truth vs forbidden substitutes / hop-skips + honest labels + honesty CI; GTM **M-154**/**M-155** (enriched 2026-07-25; no new IDs) |
| Layer residual / irreversible leak (PA) | **TB-1005**–**TB-1006** (open P1 **V1**) | NetArchTest vs runtime residual matrix + honesty CI; GTM **M-156**/**M-157**; cites **TB-950**/**TB-999**/**TB-1001** |
| Authority vs AgentTask loop (PA) | **TB-1007**–**TB-1008** (open P1 **V1**) | Canonical path + execute/result/commit forbid matrix + honesty CI; GTM **M-158**/**M-159**; Done ADR 0030/0042 / **TB-919** |
| Append-only / sealed evidence (PA) | **TB-1009**–**TB-1010** (open P1 **V1**) | Append-only vs mutable + Update-destruction matrix + honesty CI; GTM **M-160**/**M-161**; Done **TB-303**/**TB-307**/**TB-310** / ADR 0039–0045 |
| Finalize vs outbox / best-effort (PA) | **TB-1011**–**TB-1012** (open P1 **V1**) | Transactional finalize vs outbox/async + never-silent-best-effort matrix + honesty CI; GTM **M-162**/**M-163**; cites ADR 0004 / INV-003; complements **TB-992**/**TB-953** |
| Read-after-write / client readiness (PA) | **TB-1013**–**TB-1014** (open P1 **V1**) | RYW break-points + client/UI readiness contract + honesty CI; GTM **M-164**/**M-165**; cites Flow A1 / ADR 0038; complements **TB-1011**/**TB-1007** |
| PilotStrict ≠ Real / Simulator disclosure (PA Q10) | **TB-1015**–**TB-1017** (open P1 **V1**) | Orthogonal axes contract + non-Real PDF/API parity + evidence-basis Simulator signal + honesty CI; GTM **M-166**/**M-167**; complements **TB-969**–**TB-971** / **TB-983**–**TB-985** |
| Empty-scope / ADR 0037 catalog routing (PA Q6) | **TB-1018**–**TB-1019** (open P1 **V1**) | Empty→system catalog vs SingleCatalog failure matrix + honesty CI; GTM **M-168**/**M-169**; complements **TB-999**–**TB-1000** / **TB-1001**–**TB-1002** / **TB-1005**–**TB-1006**; no RLS reopen |
| Process vs provider `(RunId, TaskId)` billing (PA Q11) | **TB-1020**–**TB-1021** (open P1 **V1**) | Host-agnostic process-after-persist vs provider at-least-once matrix + honesty CI; GTM **M-170**/**M-171**; Done **TB-039**/**TB-201**; complements ACA **TB-960**–**TB-962** / **M-121**/**M-122** |
| Pre-finalize gate block vs advisory + SoD (PA Q13) | **TB-1022**–**TB-1023** (open P1 **V1**) | Block vs advisory vs SoD ownership matrix + honesty CI; GTM **M-172**/**M-173**; cites `PRE_COMMIT_GOVERNANCE_GATE` / ADR 0034; complements **TB-986** / **M-140** |
| Comparison/replay immutable snapshots (PA Q14) | **TB-1024**–**TB-1025** (open P1 **V1**) | Minimal immutable set + artifact/regenerate/verify honesty CI; GTM **M-174**/**M-175**; complements **TB-1003**/**TB-1009** |
| Operator primary object / nav collapse (PA Q16) | **TB-1026**–**TB-1027** (open P1 **V1**) | Package > finding hierarchy + collapse surfaces + honesty CI; GTM **M-176**/**M-177**; complements Done **TB-738**–**TB-747** |
| `/see-it` static vs live universe (PA Q17 + Q21) | **TB-1028**–**TB-1029** (open P1 **V1**) | Boundary + Contoso≠Claims fail-closed + **minimum** welcome→`/see-it`→CTA Option A/B; Northwind off-funnel; GTM **M-178**/**M-179**; pairs **M-107**/**M-134**; no new IDs |
| PA first-15 / package-spine IA (PA Q18) | **TB-1030**–**TB-1031** (open P1 **V1**) | Must-complete decision-signal path + narration-free `/reviews/{runId}` Finalize+export spine + honesty CI; GTM **M-180**/**M-181**; complements Done **TB-739** / **TB-1026**; does **not** reopen **M-44**/**M-47**/**M-48** |
| Launch-load failure order / degradation (PA Q19) | **TB-1032**–**TB-1033** (open P1 **V1**) | HTTP-first launch vs AOAI-ceiling Real execute + graceful degradation matrix + honesty CI; GTM **M-182**/**M-183**; complements **TB-915**/**TB-905** / **G-SCALE-01**/**G-SCALE-02** (does not replace measured drills) |
| Strangler next slice / `/result` sunset (PA Q20) | **TB-1034**–**TB-1035** (open P1 **V1**) | Authority product-default freeze + rename AgentTask loop + `POST …/result` sunset ADR + honesty CI; GTM **M-184**/**M-185**; complements **TB-1007**–**TB-1008**; does **not** reopen storage strangler (**TB-919**) |
| Operator Overview empty-state UX | **TB-1036**–**TB-1039** (open P0 **V1**) | Next-best-action hierarchy; suppress zero-theater; Do-this-next card; demo/seeded Overview → sample package; owner screenshot 2026-07-25; complements Done **TB-345**–**TB-353** / **TB-739** |

## Open items (V1 / V1.1 — shippable candidates)

| ID | Title | Cluster |
| --- | --- | --- |
| TB-874 | Terraform AWS/GCP → CanonicalObject classification + illustrative cost/service labels | Multi-cloud P1 **V1** |
| TB-876 | Customer-controlled Tier 1 AWS/GCP inventory ZIP | Multi-cloud P1 **V1** |
| TB-877 | Community summarization Graph-RAG (RAG-V2-001 remainder) | AI/Agent P1 **V1** |
| TB-878 | Iterative retrieve-critique-retry loop (RAG-V2-002 remainder) | AI/Agent P2 **V1** |
| TB-879 | Pilot-feedback retrieval for planning materialize (RAG-V1.1-003) | Stickiness P2 **V1** |
| TB-880 | Cross-tenant pattern library UI (RAG-V1.1-004) | Explainability P2 **V1** |
| TB-686 | Semantic retrieval chunking | Cutting-edge AI P2 **V1**; gated on TB-595 |
| TB-655 | Terraform root consolidation | Deployability P2 **V1** |
| TB-872 | Customer-provided Azure OpenAI connection (first BYO path) | AI model chooser P2 **V1.1** |
| TB-881 | RC12 registration duplicate-organization conflict regression | Correctness P1 **RC12** release-candidate blocker |
| TB-891 | Showcase render-mode telemetry (+ **TB-978** scenario dimension) | Traceability P1 **V1** — **TB-887**–**TB-890** Done |
| TB-978 | Showcase scenario telemetry — extend **TB-891** with `scenario` + funnel | Traceability P1 **V1** — GTM **M-133**/**M-136** |
| TB-979 | Typed sample-definition extraction — universe+ID package pins (PA Q15) | Maintainability P1 **V1** — GTM **M-134**; unblocks **TB-980** |
| TB-980 | Author Enterprise Customer Intake Modernization sample package | Commercial P1 **V1** — after **TB-979**; GTM **M-133**/**M-135** |
| TB-981 | Showcase default flip + trial/marketing universe+ID alignment (PA Q15) | Commercial P1 **V1** — after **TB-978**/**TB-980**; GTM **M-134** |
| TB-982 | Formalize AI Knowledge Assistant + Contoso/Northwind buyer-label cleanup | Commercial P2 **V1** / post-flip — GTM **M-135** |
| TB-892 | Quick Scan safety configuration (`QuickScanSafetyOptions`) | Cost safety P0 **V1** — Prompt 2 |
| TB-893 | Quick Scan pricing catalog + pre-exec cost estimate | Cost safety P0 **V1** — after **TB-892** |
| TB-894 | Atomic global hourly/daily Quick Scan budget reservations | Cost safety P0 **V1** — release-blocking |
| TB-895 | Anonymous marketing Quick Scan endpoint + per-request bounds | Cost safety P0 **V1** — after **TB-892**–**TB-894** |
| TB-896 | Distributed Quick Scan concurrency + bounded queue | Cost safety P0 **V1** — after **TB-894**/**TB-895** |
| TB-897 | Layered Quick Scan identity rate limits + duplicate abuse | Abuse P1 **V1** — not a spend substitute |
| TB-898 | Quick Scan emergency kill switch + fail-closed boot | Cost safety P0 **V1** |
| TB-899 | Quick Scan cost telemetry, dashboards, reconciliation, alerts | Operability P1 **V1** |
| TB-900 | Quick Scan sample fallback + public capacity UX | Marketability P0 **V1** — pairs **M-109** |
| TB-901 | Quick Scan adversarial cost/abuse test suite | Cost safety P0 **V1** — after core controls |
| TB-902 | Quick Scan public release gate assessment (GREEN/YELLOW/RED) | Release gate P0 **V1** — assessment-only; **M-110**, **G-QA-05** |
| TB-929 | Hot-path list SQL projection audit (omit fat `*Json`) | Performance P1 **V1** — H2 after **TB-577** |
| TB-930 | Run-detail summary + lazy-load JSON blobs | Performance P1 **V1** — pairs **TB-929** |
| TB-931 | Typed columns for hot scalars from JSON | Performance P2 **V1** — after **TB-929** inventory |
| TB-936 | Refine `/governance/alert-rules` Conditions tab | Adoption friction P0 **V1** — rule builder + preview + sample guards |
| TB-1036 | Operator Overview empty-state next-best-action hierarchy | Adoption friction P0 **V1** — never lead with Review open findings when findings=0 |
| TB-1037 | Suppress Overview zero-theater (metrics / median-delta / savings) | Adoption friction P0 **V1** — after/with **TB-1036**; extends Done **TB-349** |
| TB-1038 | Single Do-this-next empty-home card | Adoption friction P0 **V1** — after **TB-1036** |
| TB-1039 | Demo/seeded workspace Overview lands on sample package | Adoption friction P0 **V1** — after **TB-1036**; pairs `DEMO_WORKSPACES` |
| TB-995 | Polly/CB transport vs run-level surface matrix | Trustworthiness P1 **V1** — PA Q7; GTM **M-146**/**M-147** |
| TB-996 | Polly ≠ run-completeness honesty CI | Testability P1 **V1** — after **TB-995** |
| TB-997 | LLM trust-boundary ingress vs structurally-impossible matrix | Trustworthiness P1 **V1** — PA Q11; GTM **M-148**/**M-149** |
| TB-998 | LLM trust-boundary honesty CI | Testability P1 **V1** — after **TB-997** |
| TB-999 | INV-001 tenant identity single-derivation contract | Trustworthiness P1 **V1** — PA Q1; GTM **M-150**/**M-151** |
| TB-1000 | Anti-header/ambient re-derive honesty CI | Testability P1 **V1** — after **TB-999** |
| TB-1001 | Azure AI Search / Ask / Graph-RAG retrieval tenancy guarantee matrix | Trustworthiness P1 **V1** — PA Q3; GTM **M-152**/**M-153** |
| TB-1002 | Anti-per-tenant-Search-index / filter-optional honesty CI | Testability P1 **V1** — after **TB-1001** |
| TB-1003 | Committed golden manifest unit-of-truth + Evidence→…→audit hop/label contract | Trustworthiness P1 **V1** — GTM **M-154**/**M-155**; chain Q 2026-07-25 |
| TB-1004 | Anti-substitute-for-committed-manifest / fake-chain-hop honesty CI | Testability P1 **V1** — after **TB-1003** |
| TB-1005 | Layer residual-boundary + irreversible-leak matrix | Trustworthiness P1 **V1** — PA layer Q; GTM **M-156**/**M-157** |
| TB-1006 | Anti-NetArchTest-equals-isolation / silent-allowlist honesty CI | Testability P1 **V1** — after **TB-1005** |
| TB-1007 | Authority vs AgentTask-loop canonical-path + forbid matrix | Trustworthiness P1 **V1** — PA; GTM **M-158**/**M-159** |
| TB-1008 | Anti-always-execute-after-create / dual-pipeline-alive honesty CI | Testability P1 **V1** — after **TB-1007** |
| TB-1009 | Append-only / commit-sealed inventory + Update-destruction matrix | Trustworthiness P1 **V1** — PA; GTM **M-160**/**M-161** |
| TB-1010 | Anti-editable-audit / in-place-seal-rewrite / platform-WORM honesty CI | Testability P1 **V1** — after **TB-1009** |
| TB-1011 | Transactional finalize vs outbox/async + never-silent-best-effort matrix | Trustworthiness P1 **V1** — PA; GTM **M-162**/**M-163** |
| TB-1012 | Anti-committed-equals-indexed / all-audit-transactional honesty CI | Testability P1 **V1** — after **TB-1011** |
| TB-1013 | Read-after-write under async authority + outbox — client/UI readiness contract | Trustworthiness P1 **V1** — PA; GTM **M-164**/**M-165** |
| TB-1014 | Anti-create-returns-package / commit-means-Ask-ready honesty CI | Testability P1 **V1** — after **TB-1013** |
| TB-1015 | PilotStrict ≠ Real — Simulator/real disclosure contract for sponsor surfaces | Trustworthiness P1 **V1** — PA Q10; GTM **M-166**/**M-167** |
| TB-1016 | Enforce non-Real sponsor PDF/API parity + evidence-basis Simulator signal | Trustworthiness P1 **V1** — after **TB-1015** |
| TB-1017 | Anti-PilotStrict-satisfied-equals-live-model honesty CI | Testability P1 **V1** — after **TB-1016**; pairs **M-166** |
| TB-1018 | Empty/untyped-scope failure matrix — system catalog vs SingleCatalog (ADR 0037) | Trustworthiness P1 **V1** — PA Q6; GTM **M-168**/**M-169** |
| TB-1019 | Anti-catalog-alone-safe-unscoped / empty-scope-means-no-data honesty CI | Testability P1 **V1** — after **TB-1018**; pairs **M-168** |
| TB-1020 | Process vs provider `(RunId, TaskId)` idempotency + LLM billing contract | Trustworthiness P1 **V1** — PA Q11; GTM **M-170**/**M-171** |
| TB-1021 | Anti-exactly-once-LLM / zero-duplicate-bill honesty CI | Testability P1 **V1** — after **TB-1020**; pairs **M-170** |
| TB-1022 | Pre-finalize governance gate block vs advisory + SoD ownership matrix | Trustworthiness P1 **V1** — PA Q13; GTM **M-172**/**M-173** |
| TB-1023 | Anti-pack-equals-certification / priorityFloor-blocks / SoD-on-commit honesty CI | Testability P1 **V1** — after **TB-1022**; pairs **M-172** |
| TB-1024 | Comparison/replay minimal immutable snapshot set (real drift vs UI illusion) | Trustworthiness P1 **V1** — PA Q14; GTM **M-174**/**M-175** |
| TB-1025 | Anti-artifact-mode-equals-stable / live-UI-verify honesty CI | Testability P1 **V1** — after **TB-1024**; pairs **M-174** |
| TB-1026 | Operator primary-object hierarchy + nav/route collapse matrix | Trustworthiness P1 **V1** — PA Q16; GTM **M-176**/**M-177** |
| TB-1027 | Anti-finding-as-primary / dual-product-create-review honesty CI | Testability P1 **V1** — after **TB-1026**; pairs **M-176** |
| TB-1028 | Marketing static vs anonymous-live vs tenant boundary + `/see-it` universe fail-closed | Trustworthiness P1 **V1** — PA Q17 + Q21 minimum funnel; GTM **M-178**/**M-179** |
| TB-1029 | Anti-see-it-Claims-banner-Contoso-payload honesty CI | Testability P1 **V1** — after **TB-1028**; pairs **M-178** |
| TB-1030 | PA first-15 completion + narration-free package-spine IA unlock contract | Trustworthiness / adoption P1 **V1** — PA Q18; GTM **M-180**/**M-181** |
| TB-1031 | Anti-15-min-product-led-without-spine / founder-narration-required honesty CI | Testability P1 **V1** — after **TB-1030**; pairs **M-180** |
| TB-1032 | Launch-load hot-path failure order + graceful degradation matrix | Reliability / scalability P1 **V1** — PA Q19; GTM **M-182**/**M-183** |
| TB-1033 | Anti-replicas-fix-AOAI / launch-load-proven-without-drill honesty CI | Testability P1 **V1** — after **TB-1032**; pairs **M-182** |
| TB-1034 | Strangler next slice — Authority product-default freeze + `POST …/result` sunset ADR | Architectural integrity P1 **V1** — PA Q20; GTM **M-184**/**M-185** |
| TB-1035 | Anti-dual-default-run-lifecycle / result-as-finalize / legacy-coordinator-storage honesty CI | Testability P1 **V1** — after **TB-1034**; pairs **M-184** |

## Hold for reassessment (not Cursor-shippable until owner promotes / G-REAL-06)

| ID | Title | Notes |
| --- | --- | --- |
| TB-882 | Automated nav-authority/label-consistency guard | P2 **V1**; Tier 3 hold |
| TB-883 | RAG-V2 live-model Graph-RAG ablation signal | P2 **V1**; Tier 3 hold |
| TB-884 | Policy-pack attribution signal | P2 **V1**; Tier 3 hold |
| TB-885 | Policy-pack compounding-evidence ledger | P2 **V1**; Tier 3 hold |
| TB-886 | Surface tamper-evident manifest-verify in buyer-facing material | P3 **V1** (docs); cheapest early pilot-packet candidate |

## V2 window (not Cursor-shippable unless owner promotes — listed last)

| ID | Title | Notes |
| --- | --- | --- |
| TB-398 | Full enterprise ITSM connector | P3 **V2** |
| TB-687 | Prompt A/B iteration harness | P2 **V2** |
| TB-688 | Per-tier model-generation refresh cadence | P2 **V2** |
| TB-690 | Fine-tuning activation gate | P2 **V2** |
| TB-873 | Generic OpenAI-compatible endpoint adapter | P3 **V2**; after **TB-872**; ADR 0060 D4 gates |
| TB-932 | Offload large JSON payloads to blob storage | P3 **V2**; after **TB-929**–**TB-931** + measured sizes |

## Curated slices

### GTM / owner-blocked

Canonical: [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) only (see wave-3 cross-walk there / prior OPEN notes).
