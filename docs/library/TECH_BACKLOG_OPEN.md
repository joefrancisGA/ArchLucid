> **Scope:** Contributor-reference — verified **open** items extracted from the main tech backlog; not a buyer or operator document.

# Tech backlog — verified open items

> **Updated:** 2026-07-24 (added **TB-1007**–**TB-1008** — PA Authority vs AgentTask-loop canonical path + execute/result/commit forbid matrix + honesty CI; GTM **M-158**/**M-159**). Prior: 2026-07-24 (added **TB-1005**–**TB-1006** — PA layer residual boundaries + irreversible-leak matrix; GTM **M-156**/**M-157**; also indexed **TB-1003**–**TB-1004** / **M-154**/**M-155**). Prior: 2026-07-24 (added **TB-1001**–**TB-1002** — PA Q3 Ask/Search/Graph-RAG retrieval tenancy; GTM **M-152**/**M-153**). Prior: 2026-07-24 (added **TB-999**–**TB-1000** — PA Q1 INV-001 single-derivation; GTM **M-150**/**M-151**). Prior: 2026-07-22 (added **TB-936** — Alerts `/governance/alert-rules` Conditions tab refinement P0). Prior: 2026-07-22 (added **TB-929**–**TB-932** — JSON payload-shape H2 follow-on after **TB-577**; list projection audit, run-detail lazy-load, typed scalars, V2 blob offload). Prior: 2026-07-19 (added **TB-892**–**TB-902** — anonymous Quick Scan public-safety cluster; GTM **M-109**–**M-110**, **G-QA-05**; prompts `docs/architecture/quick_scan_public_safety_prompts.md`). Prior: 2026-07-19 (added **TB-887**–**TB-891** — public showcase `claims-intake-modernization` cluster; GTM **M-107**–**M-108**, **G-QA-04**). Prior: 2026-07-19 (closed tech **TB-135** / **TB-136**; GTM **G-REAL-05** / **G-ASSURANCE-02** remain open for owner execution). Prior: 2026-07-19 (added **TB-882**–**TB-886** — `LATEST_GPT55.md` §17 Tier 3 hold candidates; remain **Hold for reassessment**). Prior: 2026-07-19 (added **TB-881** — RC12 registration duplicate-organization conflict regression, release-candidate blocker, not a V1/V1.1/V2 roadmap window item). Prior: 2026-07-19 (summary-table **V2 window** — V2 rows listed last in `TECH_BACKLOG.md`; IDs unchanged). Prior: 2026-07-19 (**TB-686** promoted V2→**V1**). Prior: 2026-07-19 (**GTM purge wave 3** — **TB-135**–**TB-140**, **TB-158**–**TB-160**). Prior: 2026-07-19 (closed **TB-673**; **TB-878**–**TB-880**; GTM wave 2). Prior: 2026-07-19 (**TB-874**–**TB-877**).

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
| Public showcase (`claims-intake-modernization`) | **TB-887**–**TB-891** (open P0/P1/P2 **V1**) | Static-first SSR; disclosure copy; prod smoke; QuickNav anonymous contract; telemetry — assessment 2026-07-19 |
| Anonymous Quick Scan public safety | **TB-892**–**TB-902** (open P0/P1 **V1**) | Config → pricing → global budgets → anonymous endpoint → concurrency → abuse → kill switch → telemetry → sample UX → adversarial → release gate; assessment **SAFE TO EXPOSE: NO** until **TB-902** |
| JSON payload-shape (H2 remainder) | **TB-929**–**TB-931** open P1/P2 **V1**; **TB-932** **V2** | List `*Json` projection audit; run-detail lazy-load; typed scalars; blob offload when measured |
| Alerts Conditions tab UX | **TB-936** (open P0 **V1**) | `/governance/alert-rules?tab=rules` — rule builder, terminology, preview, sample guards |
| Polly vs run-level matrix (PA Q7) | **TB-995**–**TB-996** (open P1 **V1**) | Transport vs run-level surface matrix + honesty CI; GTM **M-146**/**M-147** |
| LLM trust boundary (PA Q11) | **TB-997**–**TB-998** (open P1 **V1**) | Ingress vs structurally-impossible matrix + honesty CI; GTM **M-148**/**M-149** |
| INV-001 single-derivation (PA Q1) | **TB-999**–**TB-1000** (open P1 **V1**) | Host-boundary decide-once vs forbidden-layer matrix + honesty CI; GTM **M-150**/**M-151**; complements Done **TB-010**/**TB-304**/**TB-925** / ARCH001 |
| Ask/Search/Graph-RAG tenancy (PA Q3) | **TB-1001**–**TB-1002** (open P1 **V1**) | Retrieval hit guarantee matrix + honesty CI; GTM **M-152**/**M-153**; Done **TB-048**/**TB-071**/**TB-604** |
| Committed golden manifest unit-of-truth | **TB-1003**–**TB-1004** (open P1 **V1**) | Unit-of-truth vs forbidden substitutes + honesty CI; GTM **M-154**/**M-155** |
| Layer residual / irreversible leak (PA) | **TB-1005**–**TB-1006** (open P1 **V1**) | NetArchTest vs runtime residual matrix + honesty CI; GTM **M-156**/**M-157**; cites **TB-950**/**TB-999**/**TB-1001** |
| Authority vs AgentTask loop (PA) | **TB-1007**–**TB-1008** (open P1 **V1**) | Canonical path + execute/result/commit forbid matrix + honesty CI; GTM **M-158**/**M-159**; Done ADR 0030/0042 / **TB-919** |

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
| TB-887 | Public showcase static-first SSR for `claims-intake-modernization` | Commercial P0 **V1** — blocks public exposure when API-connected |
| TB-888 | Public showcase illustrative-sample disclosure copy | Trustworthiness P0 **V1** — ship with **TB-887** |
| TB-889 | Production showcase availability gate | Reliability P1 **V1** — pairs with GTM **G-QA-04** |
| TB-890 | Showcase QuickNav anonymous read contract | Adoption friction P1 **V1** |
| TB-891 | Showcase render-mode telemetry | Traceability P2 **V1** |
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
| TB-995 | Polly/CB transport vs run-level surface matrix | Trustworthiness P1 **V1** — PA Q7; GTM **M-146**/**M-147** |
| TB-996 | Polly ≠ run-completeness honesty CI | Testability P1 **V1** — after **TB-995** |
| TB-997 | LLM trust-boundary ingress vs structurally-impossible matrix | Trustworthiness P1 **V1** — PA Q11; GTM **M-148**/**M-149** |
| TB-998 | LLM trust-boundary honesty CI | Testability P1 **V1** — after **TB-997** |
| TB-999 | INV-001 tenant identity single-derivation contract | Trustworthiness P1 **V1** — PA Q1; GTM **M-150**/**M-151** |
| TB-1000 | Anti-header/ambient re-derive honesty CI | Testability P1 **V1** — after **TB-999** |
| TB-1001 | Azure AI Search / Ask / Graph-RAG retrieval tenancy guarantee matrix | Trustworthiness P1 **V1** — PA Q3; GTM **M-152**/**M-153** |
| TB-1002 | Anti-per-tenant-Search-index / filter-optional honesty CI | Testability P1 **V1** — after **TB-1001** |
| TB-1003 | Committed golden manifest unit-of-truth contract | Trustworthiness P1 **V1** — GTM **M-154**/**M-155** |
| TB-1004 | Anti-substitute-for-committed-manifest honesty CI | Testability P1 **V1** — after **TB-1003** |
| TB-1005 | Layer residual-boundary + irreversible-leak matrix | Trustworthiness P1 **V1** — PA layer Q; GTM **M-156**/**M-157** |
| TB-1006 | Anti-NetArchTest-equals-isolation / silent-allowlist honesty CI | Testability P1 **V1** — after **TB-1005** |
| TB-1007 | Authority vs AgentTask-loop canonical-path + forbid matrix | Trustworthiness P1 **V1** — PA; GTM **M-158**/**M-159** |
| TB-1008 | Anti-always-execute-after-create / dual-pipeline-alive honesty CI | Testability P1 **V1** — after **TB-1007** |

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
