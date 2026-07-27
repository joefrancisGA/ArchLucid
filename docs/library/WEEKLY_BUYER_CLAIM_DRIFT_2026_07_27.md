> **Scope:** One-week proof-language / buyer-claim drift pass (2026-07-21 → 2026-07-27) on docs + UI surfaces touched in that window. Audience: engineering + GTM. Not buyer-facing.

# Weekly buyer-claim drift — SEND vs rewrite (2026-07-27)

**Status:** Inventory for **TB-1463** / **M-263**/**M-264**.  
**Method:** Git history on `docs/` + `archlucid-ui/` since 2026-07-21; cross-check against [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (includes folded WNTP), [`QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy), and open honesty clusters.

**Legend**

| Action | Meaning |
|---|---|
| **REWRITE** | Change copy/UI now — claim is false, stale, or oversells without a hedge |
| **SEND** | Keep wording only when a Real committed-run / labeled artifact / measured cohort is attached; else HOLD |
| **HOLD** | Do not put in sponsor/procurement SEND until owner evidence exists |
| **OK** | Already hedged; no new work (listed only where easy to misread) |

---

## Critical — rewrite this week

| # | Surface | Claim / language | Action | Owner |
|---|---|---|---|---|
| **C1** | [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) GTM table | Still treats **native Jira/Teams/ServiceNow as V1.1 / “do not promise GA in V1”** while `V1_SCOPE` §2.13–§2.15 commits GA connectors | **REWRITE** — flip row to shipped-GA + honest maturity (empty-state / credential caveats) | **TB-1367** / **TB-1343**; empty UX **TB-1420** |
| **C2** | Same guide § Never imply | “SOC 2 certified… **TB-135 V1.1 backlog**” | **REWRITE** — tech **TB-135** Done; owner CPA remains **G-REAL-05** | **TB-1343** / **M-190** |
| **C3** | [`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) §4 | “Reviews that took **two weeks** now take **two hours**” | **REWRITE** (unguarded quantified ROI) or **SEND** only with measured Real cohort + basis label | **TB-1367** / **M-245** |
| **C4** | `/live-demo` UI (`live-demo-page-copy.ts`) | H1/nav **“Live demo”** + Review integrity “immutable… suitable for sponsor and governance review” on fabricated/offline sample | **REWRITE** | **TB-1265**, **TB-1427** |
| **C5** | `/see-it` + welcome | “**30 seconds**” title/CTA for long scroll; “Download **evidence bundle**” for marketing PDF | **REWRITE** | **TB-1280**, **TB-1283** |
| **C6** | `/see-it` banner | Hardcoded **Healthcare claims** chrome vs Contoso-shaped preview/API risk | **REWRITE** fail-closed labels / Option A–B | **TB-1279**, **TB-1028** |

---

## High — SEND or rewrite before sponsor/procurement use

| # | Surface | Claim / language | Action | Owner |
|---|---|---|---|---|
| **H1** | [`ASSURANCE_STATUS_CANONICAL.md`](../go-to-market/ASSURANCE_STATUS_CANONICAL.md) | Phase roadmap “SOC 2 Type I **report issued (target)**”; “3P pen test planned, not yet scheduled” | **HOLD** for SEND as commitment; **REWRITE** if calendar reads as promise | **M-190** / **G-REAL-05** / **G-ASSURANCE-02** |
| **H2** | Trust Center UI + downloads | “Owner-conducted pen-test summary” / “SOC 2 self-assessment” | **SEND** only with those exact labels — never as CPA/3P | **TB-1112**, Trust Center honesty |
| **H3** | [`ROI_MODEL.md`](../go-to-market/ROI_MODEL.md) Contoso synthetic + worked example (folded this week) | Dollar/% tables | **SEND** only as **SYNTHETIC / demo-derived**; never customer ROI | **TB-983**–**TB-985**, **M-138** |
| **H4** | [`DIFFERENTIATION_PROOF_PACKET.md`](../go-to-market/DIFFERENTIATION_PROOF_PACKET.md) | “We run **honest bakeoffs**…” | **HOLD** / hedge until scoreboard sessions (**M-40**); protocol ≠ completed cohort | **TB-1456**, **M-42**/**M-40** |
| **H5** | [`POSITIONING.md`](../go-to-market/POSITIONING.md) | `/why-archlucid` + `/demo/explain` “live” Contoso seed as proof | **REWRITE** universe + mode labels; align funnel **M-107** | **TB-1028**, **TB-1306** |
| **H6** | Billing / pricing UI (touched via GTM commerce docs) | Checkout / Marketplace theater | **REWRITE** if self-serve implied; quote path only | **TB-1343**, **TB-1166** / **M-200** |
| **H7** | Bake-off / competitive talk (new contract) | EA “lost 15-min bake-off”; “beats ChatGPT” | **REWRITE** / forbid | **TB-1456**–**TB-1457**, **M-261** |

---

## Medium — keep OK if labeled; watch drift from this week’s doc folds

| # | Surface | Note | Action |
|---|---|---|---|
| **M1** | [`BUYER_PERSONAS.md`](../go-to-market/BUYER_PERSONAS.md) “100% of pilot reviews have OTel…” | Pilot **success metric**, not product guarantee | **OK** as charter metric; **REWRITE** if sold as always-on product claim |
| **M2** | Assurance / procurement packet folds (SOC roadmap, FAQ → packet) | Mostly honest deferred language | Spot-check redirects don’t 404 buyer links |
| **M3** | Advisory scans UI (TB-1127/1128) | Sample dispositions look interactive | **OK** if sample disclosure stays primary story |
| **M4** | SLA “always communicated” downtime | Soft ops language | **OK** |

---

## Not in this week’s SEND packet (owner/deferred)

| Topic | Disposition |
|---|---|
| CPA SOC 2 report | **DEFERRED_SCOPE** — **G-REAL-05** |
| Published third-party pen test | **DEFERRED_SCOPE** — **G-ASSURANCE-02** |
| Live Marketplace buy-today | **DEFERRED_SCOPE** |
| Measured deal-loss % / beats-ChatGPT publish | **HOLD** — **M-20** / **M-42** |

---

## Orchestration

Do **not** reopen Done **TB-135**/**TB-136**. Per-surface UI/docs work stays on cited TB/M rows. This inventory is the fused weekly pass; **TB-1463** owns keeping it current; **TB-1464** owns CI against reintroducing C1–C6 class phrases on scanned paths.
