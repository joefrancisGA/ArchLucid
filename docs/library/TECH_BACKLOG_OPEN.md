> **Scope:** Contributor-reference — verified **open** items extracted from the main tech backlog; not a buyer or operator document.

# Tech backlog — verified open items

> **Updated:** 2026-07-19 (closed **TB-673**; added **TB-878**–**TB-880** — promoted RAG-V2-002 iterative loop + RAG-V1.1-003/004; **GTM purge wave 2** — **TB-640**, **TB-161**–**TB-163** removed from `TECH_BACKLOG.md`). Prior: 2026-07-19 (added open **TB-877** — community summarization Graph-RAG / ADR 0057 option (a)). Prior: 2026-07-19 (added open **TB-874**–**TB-876** — remaining V1_SCOPE §2.19 multi-cloud analysis P1 cluster). Prior: 2026-07-19 (GTM purge — **TB-141**/**TB-142**/**TB-164**/**TB-236** removed from `TECH_BACKLOG.md`; canonical in `GTM_BACKLOG.md`).

## Recently closed (do not re-open)

| Cluster | IDs |
| --- | --- |
| TECH_BACKLOG archive hygiene | **TB-673** (Done 2026-07-19 — batches A/B archived; open extract curated) |
| Persona UX audit + deploy (batch A) | **TB-642** – **TB-657** (Done detail archived 2026-07-06; **TB-655** remains open; **TB-656** Done) |
| Review Package hierarchy (batch B) | **TB-617** – **TB-621** (all Done; **TB-621** closed 2026-07-06) |
| First review guide / onboarding hub | **TB-674** – **TB-679** (Done 2026-07-06/07) |
| `ArchLucid.Api` Cobertura triage | **TB-635** – **TB-637** (Done 2026-07-07) |
| Onboarding doc consolidation | **TB-659** (Done 2026-07-18) |
| Cold-start free-cost cluster | **TB-754** – **TB-759** (Done 2026-07-17) |
| Frontend/CDN shell cache | **TB-868** (Done 2026-07-17) |
| UI dependency & supply-chain | **TB-858**–**TB-865** (Done 2026-07-17) |
| GTM-only rows removed from TECH_BACKLOG | **TB-141**, **TB-142**, **TB-164**, **TB-236** (2026-07-19); **TB-161**–**TB-163**, **TB-640** (2026-07-19 wave 2) |

## Open clusters (summary rows — see `TECH_BACKLOG.md` for individual entries)

| Cluster | IDs | Summary |
| --- | --- | --- |
| Multi-cloud analysis §2.19 remainder | **TB-874** – **TB-876** (3 tickets, all open P1) | Remaining V1 AWS/GCP **analysis-path** parity after Tier 2 polling (**TB-402**/**TB-403**) and Cost grounding (**TB-603**). |
| Community summarization Graph-RAG | **TB-877** (open P1) | RAG-V2-001 remainder — ADR 0057 option (a). |
| Promoted RAG V1.1 / V2 remainders | **TB-878** – **TB-880** (3 tickets, all open P2) | Iterative retrieve-critique-retry (**TB-878**); pilot-feedback retrieval for planning materialize (**TB-879**); cross-tenant pattern library UI (**TB-880**). |
| AI initiative readiness wedge | **TB-847** – **TB-857** (11 tickets, cluster doc only — not in summary table yet) | See `docs/architecture/ai_initiative_governance.md`. |
| AI model chooser | **TB-872** – **TB-873** (**TB-869**–**TB-871** Done) | Customer-provided Azure OpenAI (**TB-872**); OpenAI-compatible adapter (**TB-873**, V2 gated). |

## Open items (auto-generated from summary table)

_Manual hygiene 2026-07-19. Open row count below matches summary-table grep (non-Done, non-DEFERRED, non-V2-only)._

| ID | Title | Cluster |
| --- | --- | --- |
| TB-874 | Terraform AWS/GCP → CanonicalObject classification + illustrative cost/service labels | Multi-cloud analysis §2.19 — Correctness P1 **V1** |
| TB-875 | Cloud-aware agent context for Aws/Gcp target reviews | Multi-cloud analysis §2.19 — AI/Agent readiness P1 **V1**; prefer after **TB-874** |
| TB-876 | Customer-controlled Tier 1 AWS/GCP inventory ZIP | Multi-cloud analysis §2.19 — Interoperability P1 **V1** |
| TB-877 | Community summarization Graph-RAG (RAG-V2-001 remainder) | AI/Agent readiness P1 **V1** — ADR 0057 option (a) |
| TB-878 | Iterative retrieve-critique-retry loop (RAG-V2-002 remainder) | AI/Agent readiness P2 **V1** — promoted §17 |
| TB-879 | Pilot-feedback retrieval for planning materialize (RAG-V1.1-003) | Stickiness P2 **V1** — promoted §17 |
| TB-880 | Cross-tenant pattern library UI (RAG-V1.1-004) | Explainability P2 **V1** — ADR 0031 aggregates |
| TB-398 | Full enterprise ITSM connector | Interoperability P3 — **V2**; out of scope unless owner promotes |
| TB-655 | Terraform root consolidation | Deployability P2 **V1**; depends on **TB-654** Done |
| TB-872 | Customer-provided Azure OpenAI connection (first BYO path) | AI model chooser P2 — **V1.1**; ADR 0060 cleared |

## Curated slices (manual — spot-check against table above)

### GTM / owner-blocked

**Do not track GTM execution in `TECH_BACKLOG.md`.** Canonical: [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md).

- **M-93** (dogfood sample-report; historical **TB-640** removed 2026-07-19)
- **M-22**/**M-23**/**M-36** (paid pilot; historical **TB-161** doc shipped)
- **G-COMMERCE-01**/**G-COMMERCE-02** / **M-94**/**M-95** (historical **TB-163** doc shipped)
- Assurance V1.1: **TB-135**/**TB-136** (**G-REAL-05** for CPA kickoff pointer)

### Real-mode / eval (owner or credentialed CI)

| ID | Title |
| --- | --- |
| TB-140 | Real-mode eval corpus — Partial (exemplars + nightly scoring shipped; live credentialed invoke remains owner / **G-REAL-01**) |
