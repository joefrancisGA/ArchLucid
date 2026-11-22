> **Scope:** Working triage of ArchLucid and SecureNow release blockers and proposed foundations; historical source backlogs remain authoritative and this document is not evidence of completed implementation.

# Active technical backlog — ArchLucid 1.0, SecureNow 1.0, and 2.0 foundations

**Created:** 2026-11-21  
**Status:** Proposed triage and migration snapshot; source status must be revalidated against current code and CI before implementation  
**Priorities:** Immediate > Critical > High > Medium > Low  
**Workstreams:** QA & stabilization > Release readiness > 2.0 architecture foundations (within each priority)

> **Release-first rule:** Ship 1.0. Prepare for 2.0. Don't let 2.0 delay 1.0.

## Source preservation and migration rules

- The pre-existing [technical backlog](library/TECH_BACKLOG.md), [verified open-item extraction](library/TECH_BACKLOG_OPEN.md), and [SecureNow technical backlog](securenow/TECHNICAL_BACKLOG.md) remain **unchanged** as historical references. Do not delete closed entries from the archive.
- This new active backlog includes open entries from the September 23 open-item extraction and outstanding SecureNow rows from its November 2 backlog, plus explicitly proposed 2.0 foundations. Rows explicitly marked **Done/Shipped/Closed** in the parsed source tables were excluded.
- **Important:** These sources are historical snapshots, not verified November 21 code state. Some items may have shipped since; verify each against current master/RC48 and CI before treating it as still open. SecureNow source contains a contradictory performance summary (SN-PERF-20–24 marked Shipped in the summary but Backlog in detail); exclude those pending reconciliation rather than reopening them.
- Existing stable TB IDs are preserved. New proposals use FND-* IDs. Cross-listed TB IDs from SecureNow are deduplicated.
- A backlog row does **not** authorize implementation, release, destructive operations, or production changes. Deferred/hold items retain their original gating restrictions.
- 'Immediate' is reserved for **freshly verified current release blockers**; no unverified historical row is automatically labeled Immediate. The top Critical items are first to validate.
- This is a technical backlog; commercial outreach and marketing execution stay in the separate [GTM backlog](go-to-market/GTM_BACKLOG.md), though technical release-enablement is included here.

## Triage and execution policy

1. Verify status and acceptance criteria on current master/RC48 before starting an inherited row; close or remove it from this active backlog if already delivered.
2. Address verified Immediate and Critical release blockers first. Within a priority, QA & stabilization precedes release readiness, which precedes 2.0 foundations.
3. 1.0 must satisfy CI, security, defect evidence, installation, demo, documentation, and onboarding gates.
4. 2.0 work is primarily **contracts, ADRs, schemas, extension points and disabled-by-default scaffolding**. No untested active autonomous production module enters 1.0.
5. Avoid duplicate effort; prefer small, measurable slices. Suggested effort heuristic: 65% QA, 25% release, 10% foundations, revisited as evidence changes.

## Priority counts

| Priority | QA & stabilization | Release readiness | 2.0 foundations | Total |
| --- | ---: | ---: | ---: | ---: |
| Immediate | 0 | 0 | 0 | 0 |
| Critical | 7 | 5 | 0 | 12 |
| High | 262 | 141 | 0 | 403 |
| Medium | 10 | 2 | 15 | 27 |
| Low | 0 | 0 | 63 | 63 |

## Ordered active backlog

Each section is ordered **QA → release readiness → 2.0 foundations**. Within each workstream, inherited IDs retain traceability; order is a proposed triage sequence, not a validated dependency graph.

### Immediate

### Critical

#### QA & stabilization (7)

| ID | Technical item | Origin / qualification |
| --- | --- | --- |
| TB-935 | TanStack Query + virtualization for alerts / reviews hub / audit lists | TECH_BACKLOG_OPEN.md; Performance P0 **V1** — extends **TB-694**/**TB-695**; peer **TB-2023**; promoted 2026-08-06 |
| TB-1152 | Azure Boards page load — isolate failures (no Promise.all wipe) | TECH_BACKLOG_OPEN.md; Reliability P0 **V1** — with **TB-1151** |
| TB-1153 | Azure Boards — never show raw Database Query Failed as status | TECH_BACKLOG_OPEN.md; Trustworthiness P0 **V1** — with **TB-1151** |
| TB-1162 | ServiceNow page load — isolate failures (no Promise.all wipe) | TECH_BACKLOG_OPEN.md; Reliability P0 **V1** — with **TB-1161**; cf. **TB-1152** |
| TB-1163 | ServiceNow — never show raw API/problem titles as connection status | TECH_BACKLOG_OPEN.md; Trustworthiness P0 **V1** — with **TB-1162**; cf. **TB-1153** |
| TB-1175 | Teams draft vs saved honesty (prefilled recommended + example fields) | TECH_BACKLOG_OPEN.md; Trustworthiness P0 **V1** — with **TB-1174** |
| TB-1418 | Tenant isolation DiD structural vs convention vs too-strong map (ADR 0037 / RLS non-control) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — PA DiD class map; GTM **M-255**/**M-256** |

#### Release readiness (5)

| ID | Technical item | Origin / qualification |
| --- | --- | --- |
| TB-1166 | Billing tier value-ladder coherence — implement owner repricing decision | TECH_BACKLOG_OPEN.md; Commercial / trustworthiness P0 **V1** — owner `/administration/settings/billing` ~64/100; after GTM **M-200** |
| TB-1771 | `/integrations/cloud-connections/gcp` purge Preview maturity copy | TECH_BACKLOG_OPEN.md; Trustworthiness P0 **V1** — IGC ~44 |
| TB-2028 | Marketing `/welcome` First Load JS — shed shared operator shell chunks | TECH_BACKLOG_OPEN.md; Performance P0 **V1** — owner UI speed ask 2026-07-31; promoted 2026-08-06 |
| TB-2029 | SSE-first run progress + shell banner poll hygiene | TECH_BACKLOG_OPEN.md; Performance P0 **V1** — owner UI speed ask 2026-07-31; promoted 2026-08-06 |
| TB-2030 | Expand First Load JS baseline to `/` (+ optional alert hubs) | TECH_BACKLOG_OPEN.md; Performance P0 **V1** — extends **TB-573**/**TB-691**; promoted 2026-08-06 |

### High

#### QA & stabilization (262)

| ID | Technical item | Origin / qualification |
| --- | --- | --- |
| TB-876 | Customer-controlled Tier 1 AWS/GCP inventory ZIP | TECH_BACKLOG_OPEN.md; Multi-cloud P1 **V1** |
| TB-877 | Community summarization Graph-RAG (RAG-V2-001 remainder) | TECH_BACKLOG_OPEN.md; AI/Agent P1 **V1** |
| TB-891 | Showcase render-mode telemetry | TECH_BACKLOG_OPEN.md; Traceability P1 **V1** |
| TB-899 | Quick Scan cost telemetry, dashboards, reconciliation, alerts | TECH_BACKLOG_OPEN.md; Operability P1 **V1** |
| TB-931 | Typed columns for hot scalars from JSON | TECH_BACKLOG_OPEN.md; Performance P2 **V1** — after **TB-929** inventory |
| TB-1121 | Anti-security-review-ready-without-musts honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1120**; pairs **M-192** |
| TB-1123 | Anti-RLS-as-live / workspace-boundary / crypto-Search honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1122**; pairs **M-194** |
| TB-1137 | Governance setup checklist visual design | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1135** |
| TB-1138 | Governance setup foundation panel vs progress dedupe | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1137** |
| TB-1141 | Cloud provider summary cards — single primary CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1139** |
| TB-1143 | Cloud connections empty/not-configured — suppress zero theater | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1141** |
| TB-1145 | Anti-SOC2-certified / pen-test-in-flight / almost-attested honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1144**; pairs **M-196** |
| TB-1148 | Jira not-configured message dedupe | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1146** |
| TB-1156 | Dual ManifestHash / GoldenManifestFingerprint + projection evolution contract | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — PA hasher Q; GTM **M-198**/**M-199** |
| TB-1157 | Production ManifestHashService deliberate re-lock CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1156**; pairs **M-198** |
| TB-1161 | ServiceNow not-configured dead end — guided admin CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner `/integrations/servicenow` ~50/100 |
| TB-1165 | ServiceNow empty composition — setup progress drives primary story | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1161**/**TB-1164** |
| TB-1171 | ServiceNow page title — show nav icon via PageHeading | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner ServiceNow icon gap 2026-07-25 |
| TB-1172 | Golden-cohort re-lock vs rubber-stamp + never-re-lockable invariants contract | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — PA cohort re-lock Q; GTM **M-201**/**M-202** |
| TB-1173 | Anti-rubber-stamp cohort re-lock / unexplained mass SHA rewrite honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1172**; pairs **M-201** |
| TB-1174 | Teams not-configured — StatusTag + guided next step | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner `/integrations/teams` ~60/100 |
| TB-1176 | Teams CTA hierarchy — Validate → Test → Save + disabled-test reason | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1174** |
| TB-1177 | Teams operator spacing density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1174**; cf. **TB-1170** |
| TB-1180 | Recycle bin retention transparency — actual window + purge date | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1179**; API + UI |
| TB-1181 | Recycle bin discoverability — unbury entry from Technical details | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — after **TB-1179** |
| TB-1182 | Recycle bin status presentation + operator density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1180** |
| TB-1183 | Teams page — remove Slack notifications cross-link | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner `/integrations/teams` 2026-07-25; with **TB-1178** |
| TB-1185 | Slack page — remove Teams notifications cross-link | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner `/integrations/slack` ~57/100; parity **TB-1183** |
| TB-1186 | Slack not-configured — StatusTag + guided next step | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1185** |
| TB-1188 | Slack help/readiness link dedupe (header vs aside) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1185**/**TB-1187** |
| TB-1189 | Slack operator spacing density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1185**; cf. **TB-1177** |
| TB-1190 | Slack CTA hierarchy — Test → Save on add form | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1186** |
| TB-1191 | Webhooks page — remove Jira/ServiceNow/Teams/Slack cross-link strip | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner `/integrations/webhooks` ~56/100; parity **TB-1183**/**TB-1185** |
| TB-1192 | Webhooks not-configured — StatusTag + guided next step | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1191** |
| TB-1194 | Webhooks operator spacing density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1191**; cf. **TB-1177**/**TB-1189** |
| TB-1195 | Webhooks empty composition — suppress zero theater | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1192** |
| TB-1196 | Agent→decisioning Real-variance isolation contract (typed proposals only) | TECH_BACKLOG_OPEN.md; AI/Agent readiness P1 **V1** — PA Q3 agent/decisioning; GTM **M-203**/**M-204** |
| TB-1197 | Anti-unvalidated-proposal-overlay / prose-into-governance honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1196**; pairs **M-203** |
| TB-1200 | Settings hub — remove Recent changes empty theater | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1199** |
| TB-1201 | Settings hub — PageHeading icon + PageContextualHelpButton | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1198**; parity **TB-1184** |
| TB-1202 | Settings hub — section nav same-page jumps as links | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — a11y baseline; with **TB-1201** |
| TB-1204 | Post-strangler residual coupling hunt + discipline-test retirement criteria | TECH_BACKLOG_OPEN.md; Architectural integrity P1 **V1** — PA Q4; GTM **M-205**/**M-206** |
| TB-1205 | Anti-delete-pins-as-complete / soft-bridge-as-dual-storage honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1204**; pairs **M-205** |
| TB-1210 | Users & roles — Operator vs Architect vocabulary honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — owner `/administration/settings/users` ~49/100 |
| TB-1212 | Users & roles — breadcrumb/nav title consistency | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1210** |
| TB-1213 | Users & roles API keys tab — dedicated empty + primary CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1211** |
| TB-1214 | Users & invitations — empty composition / guided next step | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1211** |
| TB-1215 | Users & roles — PageContextualHelpButton at top | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1210**; parity **TB-1184** |
| TB-1216 | AI usage — Administration vs Settings wayfinding (breadcrumb / URL honesty) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner `/administration/settings/ai-usage` ~51/100; TB-404 |
| TB-1218 | AI usage — PageHeading icon + PageContextualHelpButton | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1216**; parity **TB-1184** |
| TB-1219 | AI usage — dedupe Edit budget / budget-control CTAs | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1216** |
| TB-1222 | Anti-all-findings-evidence-grounded / empty-EvidenceRefs-as-proof honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1221**; pairs **M-207** |
| TB-1223 | Security & Trust — Administration vs Settings wayfinding (breadcrumb / URL honesty) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner `/administration/settings/security-trust` ~53/100; TB-404; with **TB-1216** |
| TB-1224 | Security & Trust — collapse triple intro into one hero | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1223** |
| TB-1225 | Security & Trust — PageHeading icon + PageContextualHelpButton | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1224**; parity **TB-1184** |
| TB-1226 | Security & Trust — Available-now primary CTA hierarchy | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1224** |
| TB-1227 | Security & Trust — dedupe security@ contact CTAs | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1223** |
| TB-1228 | Faithfulness/support-ratio scoring lane positioning contract | TECH_BACKLOG_OPEN.md; AI/Agent readiness P1 **V1** — PA Q6; GTM **M-209**/**M-210** |
| TB-1229 | Anti-faithfulness-as-commit-gate / support-ratio-as-legal-truth honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1228**; pairs **M-209** |
| TB-1230 | Shared hallucination defense plane (anti mode-fork) contract | TECH_BACKLOG_OPEN.md; AI/Agent readiness P1 **V1** — PA Q7; GTM **M-211**/**M-212** |
| TB-1231 | Anti-Simulator-safe-equals-Real / forked-defense-stack honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1230**; pairs **M-211** |
| TB-1232 | Tenant DiD erosion modes + enforcement-beyond-predicates contract | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — PA Q8; GTM **M-213**/**M-214** |
| TB-1233 | Anti-WHERE-TenantId-equals-isolation / ARCH-alone-proves / RLS-as-beyond-predicate honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1232**; pairs **M-213** |
| TB-1244 | Azure workload privilege-escalation seam matrix (SQL bootstrap vs runtime MI) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — PA Q9; GTM **M-215**/**M-216** |
| TB-1244 | Azure workload privilege-escalation seam matrix (SQL bootstrap vs runtime MI) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — PA Q9; GTM **M-215**/**M-216** |
| TB-1245 | Anti-least-privilege-while-db_owner-colocated / PE-equals-private / AOAI-Contributor honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1244**; pairs **M-215** |
| TB-1245 | Anti-least-privilege-while-db_owner-colocated / PE-equals-private / AOAI-Contributor honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1244**; pairs **M-215** |
| TB-1248 | Engineering troubleshooting — align route slug with page title | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1246** |
| TB-1256 | Procurement FAQ — diligence CTA chrome (trust / pack / DPA) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1253** |
| TB-1257 | Procurement FAQ — in-app-only link map + shorten SSO answer | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1253**; pairs **TB-1254** |
| TB-1259 | Starting/review guide — wizard companion CTA to `/reviews/new` | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — after **TB-1258** |
| TB-1261 | Starting/review guide — unify empty-state / alias / search discovery | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — empty-state still dirty-blocked; aliases shipped with **TB-1258** |
| TB-1262 | Starting/review guide — collapse Related guides density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1259** |
| TB-1263 | Dapper/DDL/satellite dual-write breakdown signals + pre-ORM strategy ladder contract | TECH_BACKLOG_OPEN.md; Maintainability P1 **V1** — PA Q11; GTM **M-219**/**M-220** |
| TB-1264 | Anti-EF-fixes-tenancy-immutability-perf / ORM-under-duress honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1263**; pairs **M-219** |
| TB-1270 | Concurrent execute + idempotent commit race resolution contract | TECH_BACKLOG_OPEN.md; Data consistency P1 **V1** — PA Q12; GTM **M-221**/**M-222** |
| TB-1271 | Anti-exactly-once-commit / silent-double-package / retry-never-spends honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1270**; pairs **M-221** |
| TB-1273 | Integration DLQ — align H1/nav to Failed integration messages | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1272** |
| TB-1274 | Integration DLQ — EnterpriseTable + review deep links; quiet UUIDs | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1272**; TB-117 parity |
| TB-1275 | Integration DLQ — empty/error/loading polish + operator density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1274** |
| TB-1276 | Integration DLQ — mutation CTA hierarchy + Dialog confirm + filters | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1272** |
| TB-1277 | GoldenManifest content-schema evolution contract (tolerant readers primary) | TECH_BACKLOG_OPEN.md; Data consistency P1 **V1** — PA Q13; GTM **M-223**/**M-224** |
| TB-1278 | Anti-schema-column-as-readability / dual-write-upgrades-history / rewrite-sealed honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1277**; pairs **M-223** |
| TB-1281 | `/see-it` — first-viewport hero budget | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1279** |
| TB-1285 | Security & Trust — StatusTag for Available now / Under NDA / Roadmap | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1284**; TB-116 parity |
| TB-1286 | Security & Trust — operator density + badge-legend StatusTag samples | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1285** |
| TB-1288 | Anti-gates-alone-FinOps / call-site-reserve-enough / direct-SDK-bypass honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1287**; pairs **M-225** |
| TB-1290 | Recycle bin — Dialog confirm before Restore | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1289** |
| TB-1291 | Recycle bin — OperatorEmptyState + loading notice | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1182** |
| TB-1292 | Fine-tuning promotion decision record (code-rollback-grade audit) contract | TECH_BACKLOG_OPEN.md; Traceability P1 **V1** — PA Q15; GTM **M-227**/**M-228** |
| TB-1293 | Anti-ratio-only-promote / silent-model-swap / rollback-without-record honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1292**; pairs **M-227** |
| TB-1294 | `/welcome` — first-viewport hero budget | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner welcome ~50/100; traffic **WXX**; complements **M-09** |
| TB-1303 | `/why` — collapse triple comparison density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1301** |
| TB-1308 | `/why-archlucid` — purge eng metric hints + repo doc footer | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1306**; parity **TB-1297**/**TB-1254** |
| TB-1309 | `/why-archlucid` — primary CTA to sample architecture package | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1306** |
| TB-1311 | First async-orchestration forcing workload + run state machine freeze (commit-safe) | TECH_BACKLOG_OPEN.md; Architectural integrity P1 **V1** — PA 2026-07-26 async/DTF; GTM **M-231**/**M-232** |
| TB-1312 | Anti-everything-in-process / DTF-required-for-V1 / commit-inside-orchestrator honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1311**; pairs **M-231** |
| TB-1313 | `/auth/session-expired` — brand + h1 + document title | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner session-expired ~59/100; traffic **ASU** |
| TB-1314 | `/auth/session-expired` — Suspense + loading fallback (callback parity) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1313** |
| TB-1315 | `/auth/session-expired` — safe secondary exit (no auth-bounce `/`) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1313** |
| TB-1316 | `/auth/session-expired` — AuthErrorPanel recovery honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1313** |
| TB-1317 | Container Apps Terraform drift escape classes + provably authoritative state | TECH_BACKLOG_OPEN.md; Deployability P1 **V1** — PA 2026-07-26 CA/IaC; GTM **M-233**/**M-234** |
| TB-1318 | Anti-TF-state-is-SoT-with-silent-ignores / portal-scale-undetected honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1317**; pairs **M-233** |
| TB-1324 | Policy-pack / rule-set evaluation hybrid (versioned data plane + compiled interpreter) | TECH_BACKLOG_OPEN.md; Architectural integrity P1 **V1** — PA Q19 packs×frameworks; GTM **M-235**/**M-236** |
| TB-1325 | Anti-compile-each-pack-engine / Turing-pack-DSL / pack-equals-cert honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1324**; pairs **M-235** |
| TB-1332 | `/help/first-architecture-review` — sample review CTA Claims/universe label honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1331**; pairs **TB-1028**/**TB-1283** |
| TB-1333 | `/help/first-architecture-review` — stepper pending chrome | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1331**; extends **TB-1042** |
| TB-1334 | `/help/first-architecture-review` — post-stepper density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1331**; extends **TB-1043** |
| TB-1335 | `/help/first-architecture-review` — related-guides IA canonicalize | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1331**; pairs **TB-1258** |
| TB-1336 | 100× review-volume fail-first order + option-preserving capacity ledger | TECH_BACKLOG_OPEN.md; Scalability P1 **V1** — PA Q20 100× reviews; GTM **M-237**/**M-238** |
| TB-1337 | Anti-SQL-fails-first-at-100x / premature-blob-or-DTF / replicas-fix-TPM honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1336**; pairs **M-237** |
| TB-1357 | Purge first-session CLI / PowerShell proof theater (home + reviews/new) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1355**; parity **TB-1346** |
| TB-1366 | Anti-beats-ChatGPT / cheaper-TCO-than-seats honesty CI | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — after **TB-1365**; pairs **M-243** |
| TB-1394 | `/help/repeat-review-loop` — specialty second-review companion + Compare CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner HRX ~40/100; traffic **HRX** |
| TB-1415 | Anti-bare-HelpTopicMarkdownView / ungated-technical-doc honesty CI + ≤~50 inventory | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1414**; pairs **M-251** |
| TB-1416 | INV-001 / decide-once / committed-manifest PA triad challenge matrix | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — PA decide triad; GTM **M-253**/**M-254** |
| TB-1419 | Anti-convention-as-structural / RLS-as-control / WHERE-equals-boundary honesty CI | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — after **TB-1418**; pairs **M-255** |
| TB-1423 | Deployment status — StatusTag/overall pill honesty (StatusPill → design-system) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1422**; pairs **TB-116**/**TB-1285** |
| TB-1426 | Deployment status — related-links external honesty + BUILD_ID chrome soften | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1422** |
| TB-1447 | Architectures list — drafts vs packages title hierarchy honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1446**; pairs **TB-1026**/**TB-1400** |
| TB-1448 | Architectures list — browser-local registry honesty (not tenant inventory theater) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1446** |
| TB-1449 | Architectures list — first-viewport density (disclosure + helper + empty) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1446** |
| TB-1450 | Architectures list — loading hydrate + row density (EnterpriseTable / scan) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1446**; pairs **TB-117** |
| TB-1451 | `/architectures/[id]` — PageHeading H1 + fix metadata title (not Create architecture) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner ARA ~55/100; traffic **ARA** |
| TB-1452 | Architecture draft workspace — StatusTag honesty (not always Status: draft) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1451**; pairs **TB-116** |
| TB-1453 | Architecture draft workspace — loading/error polish + Architectures list wayfinding | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1451**; pairs **TB-1450** |
| TB-1454 | Architecture draft workspace — first-viewport density (lead + disclosure + alternatives) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1451**; pairs **TB-1449** |
| TB-1455 | Architecture draft workspace — Save vs autosave CTA hierarchy honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1451** |
| TB-1458 | `/architectures/new` — PageHeading H1 + PageContextualHelpButton | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner ARN ~58/100; traffic **ARN** |
| TB-1459 | Architecture creation bootstrap — browser-local recent-drafts honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1458**; pairs **TB-1448** |
| TB-1460 | Architecture creation bootstrap — autosave reassurance only when true | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1458** |
| TB-1461 | Architecture creation bootstrap — Create vs Start new / resume title hierarchy | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1458**; pairs **TB-1447** |
| TB-1462 | Architecture creation bootstrap — resume-first viewport when drafts exist | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1458** |
| TB-1479 | Alert rules Rules tab — empty `gap-8` list+create+preview two-col | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1477**; pairs **TB-936** |
| TB-1484 | Compliance journey — ISR `revalidate=300` + surface test id | TECH_BACKLOG_OPEN.md; Performance/testability P2 **V1** — with **TB-1483**; pairs **TB-567** |
| TB-1554 | Operator EmptyState → Compact migration inventory (dense hubs) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — after **TB-1552** |
| TB-1556 | Vitest — Compact empty on allowlist + ban empty-theater stacks | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — after **TB-1553**–**TB-1555**; pairs **TB-1482** |
| TB-1574 | Live preview/readiness rails — hide or stack when empty/sparse | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1572**; coordinate **TB-1478**/**TB-1479** |
| TB-1576 | Vitest — side-rail kind allowlist + ban teaching/static two-col on empty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — after **TB-1573**–**TB-1575**; pairs **TB-1482** / **TB-1556** |
| TB-1580 | Composite alert rules — design-system fields + Create Button | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1579** |
| TB-1582 | Composite alert rules — empty/form first-viewport | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1579** |
| TB-1583 | Composite alert rules — hide reserved reopen-delta + loading skeleton | TECH_BACKLOG_OPEN.md; Trustworthiness/adoption P1 **V1** — with **TB-1579** |
| TB-1585 | Alert rules Conditions — collapse dual lead | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1584** |
| TB-1586 | Alert rules Conditions — Create `variant="primary"` + one primary CTA locus | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1584** |
| TB-1588 | Alert rules Conditions — design-system Select + list loading skeleton | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1584** |
| TB-1590 | Alert simulation/tuning — design-system fields + primary Simulate/Recommend | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1589** |
| TB-1591 | Alert simulation — human nested sub-tab labels | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1589** |
| TB-1593 | Alert tuning — score-breakdown operator honesty + dual lead/rank density | TECH_BACKLOG_OPEN.md; Trustworthiness / adoption P1 **V1** — with **TB-1589** |
| TB-1597 | Alerts inbox — suppress summary zero-theater when empty/no rules | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1594** |
| TB-1598 | Alerts inbox — empty CTA `projectId=default` honesty + list loading skeleton | TECH_BACKLOG_OPEN.md; Trustworthiness/adoption P1 **V1** — with **TB-1594** |
| TB-1613 | Admin diagnostics — inbound label honesty + doc-href map | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1609** |
| TB-1619 | `/help/azure-boards` specialty integration companion + Open Azure Boards CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — HAZ ~51/100 |
| TB-1624 | Customer policy-pack rule sandbox / commit pin / blast-radius claim map | TECH_BACKLOG_OPEN.md; Architectural integrity P1 **V1** — PA pack extensibility Q; GTM **M-298**/**M-299**; see `POLICY_PACK_CUSTOMER_RULE_SANDBOX_PIN_BLAST_RADIUS_CLAIM_MAP.md`; orchestrates **TB-1324** |
| TB-1625 | Anti-WASM-rule-sandbox / anti-pack-RCE / anti-platform-wide-degrade honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1624**; pairs **M-298** |
| TB-1626 | `/help/azure-permissions` first-viewport Configure/Verify primary CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — HEA ~63/100 |
| TB-1636 | `/help/comparison-replay` specialty guide + Open Compare CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — CO ~48 |
| TB-1647 | Advisory schedules + Alert rules — card stacks → EnterpriseTable (or justified entity-summary) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1646**; pairs **TB-1477**/**TB-1479** |
| TB-1648 | Slack + Webhooks — unify destination inventory on EnterpriseTable | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1646**; pairs **TB-1185**/**TB-1191** |
| TB-1649 | Inventory honesty + action budget + raw-table migrate inventory | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — after **TB-1646**; Recurrence/Digests/Reviews/artifacts/users |
| TB-1650 | Vitest — EnterpriseTable allowlist + ban inventing card/raw inventory | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — after **TB-1647**–**TB-1649**; pairs **TB-1556** / **TB-1576** |
| TB-1663 | Alert rules hub — migrate hand-rolled folder tabs onto shared Tabs | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1661**; pairs **TB-1584**/**TB-1589** (do not reopen content UX) |
| TB-1669 | Integrations + topic-map/registry completeness for remaining nav surfaces | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1666**; coordinate **TB-1139**/**TB-1184**–**TB-1195** |
| TB-1670 | Vitest — PageContextualHelpButton allowlist + non-null topic guard | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — after **TB-1667**–**TB-1669** |
| TB-1672 | Compare + provenance — bare body/outline links → OPERATOR_LINK | TECH_BACKLOG_OPEN.md; Accessibility P1 **V1** — with **TB-1671** |
| TB-1674 | Finding badges + secondary surfaces — StatusTag-as-link cue + export/ID/pinned inventory | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1671** |
| TB-1696 | `/help/integration-readiness` specialty guide + Open readiness CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — HEI ~50 |
| TB-1711 | `/help/path-chooser` specialty next-step chooser | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — HPX ~35 |
| TB-1731 | `/help/prior-manifest-retrieval` specialty Ask-memory guide + Open Ask CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — HEP ~50 |
| TB-1756 | `/integrations/azure-boards` operator density / whitespace after TB-1151 pack | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — IAZ ~38 |
| TB-1757 | Azure Boards aside — setup chip StatusTag parity | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1756** |
| TB-1758 | Azure Boards — load skeleton / partial-refresh honesty | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1756** |
| TB-1760 | Azure Boards Vitest — Promise.all isolation + loadError sanitize guard | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1756** |
| TB-1761 | `/integrations/cloud-connections/aws` Azure-parity guided connect wizard | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — INC ~44 |
| TB-1762 | AWS cloud detail — live Validate + Recent activity (replace stubs) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1761** |
| TB-1763 | AWS cloud detail — Tier 2 / hosted-poll jargon purge in errors | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1761** |
| TB-1764 | AWS cloud detail — empty/connected single primary CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1761** |
| TB-1766 | `/integrations/cloud-connections/azure` Tier/hosted-pull jargon purge | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — INZ ~72 |
| TB-1767 | Azure cloud detail — collapse or wire Validate + Recent activity stubs | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1766** |
| TB-1769 | Azure cloud detail — hydrate saved connection + disconnect/re-validate CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1766** |
| TB-1770 | Azure cloud detail — Vitest banned jargon + no stub Validate/Activity | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1766** |
| TB-1772 | GCP cloud detail — Azure-parity guided connect wizard | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1771** |
| TB-1782 | Atlassian OAuth callback — brand shell + loading honesty | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — after **TB-1781** |
| TB-1785 | Atlassian OAuth callback — Vitest success/fail/cancel states | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1781** |
| TB-1788 | Recommendation-learning ops — Load persisted vs Refresh toolbar honesty | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1786** |
| TB-1789 | Recommendation-learning ops — enterprise chrome (header/StatusTag/EnterpriseTable) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1786** |
| TB-1790 | Recommendation-learning ops — Vitest preview/rebuild/rollback + Execute gate | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1786** |
| TB-1812 | `/patterns/[patternKey]` — contextual peer-compare (not hard-coded BFF) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1811** |
| TB-1815 | `/patterns/[patternKey]` — CTA hierarchy + Vitest anti-regress | TECH_BACKLOG_OPEN.md; Adoption friction P2 **V1** — with **TB-1811** |
| TB-1830 | Evidence-trace Vitest anti-regress + pair **TB-987** stickiness honesty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1826** |
| TB-1835 | archTab Activity — Vitest dual-param + panel orientation guards | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1831** |
| TB-1836 | Traffic honesty — `archTab=clarifications` create-home only | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — REC ~44 |
| TB-1840 | Clarifications tab — Vitest CTA + badge + traffic honesty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1836** |
| TB-1841 | Traffic honesty — `archTab=diagram` create-home only | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — RED ~50 |
| TB-1842 | Diagram tab clarify CTA must be run-scoped (not bare new create) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1841** |
| TB-1843 | Diagram insufficient/empty orientation + next clarify step | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1841** |
| TB-1845 | Diagram tab — Vitest CTA + insufficient + traffic honesty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1841** |
| TB-1846 | Traffic honesty — `archTab=evidence` create-home only | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — REE ~46 |
| TB-1847 | Create-home Evidence — orientation + uploaded inventory (not upload-only) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1846** |
| TB-1848 | Create-home Evidence — cross-link Diagram as supporting evidence | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1846** |
| TB-1849 | Evidence tab chrome — Capture/Add naming + card density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1846** |
| TB-1850 | Evidence tab — Vitest orientation + traffic honesty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1846** |
| TB-1851 | Traffic honesty — `archTab=findings` create-home only | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — REF ~48 |
| TB-1852 | Create-home Findings — pre-commit assessment orientation | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1851** |
| TB-1853 | Create-home Findings empty when assessment incomplete | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1851** |
| TB-1855 | Findings tab — Vitest orientation + traffic honesty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1851** |
| TB-1861 | Traffic honesty — `archTab=overview` create-home only | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — REO ~55 |
| TB-1863 | Overview vs Clarifications — Still needed dedupe | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1861** |
| TB-1864 | Overview empty structured-sections orientation | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1861** |
| TB-1865 | Overview tab — Vitest CTA + traffic honesty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1861** |
| TB-1866 | Traffic honesty — `path=detailed` is Templates and imports tab | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — REN ~48 |
| TB-1867 | `/reviews/new` path tabs must sync `?path=` in the URL | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1866** |
| TB-1868 | Detailed path — label/hint vs full-wizard density honesty | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1866** |
| TB-1869 | Detailed path — nested page-container / dual-chrome cleanup | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1866** |
| TB-1870 | Detailed path — Vitest URL sync + traffic honesty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1866** |
| TB-1873 | Quick start vs legacy `QuickReviewWizard` dual-surface honesty | TECH_BACKLOG_OPEN.md; Maintainability P1 **V1** — with **TB-1871** |
| TB-1874 | Quick start Card chrome / first-viewport density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1871** |
| TB-1875 | Quick start — Vitest URL sync + traffic honesty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1871** |
| TB-1876 | Traffic honesty — `path=guided-intake` is Guided intake tab | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — ENE ~56 |
| TB-1877 | Guided intake — execute URL `path` sync with **TB-1867** | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1876** |
| TB-1879 | Guided intake Card / colored-banner density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1876** |
| TB-1880 | Guided intake — Vitest URL sync + jargon + traffic honesty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1876** |
| TB-1881 | Account security — title/scope honesty (sign-in methods, not SSO suite) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — SEA ~52 |
| TB-1883 | Account security — in-page remove confirm + blocked-remove reason | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1881** |
| TB-1885 | Account security — Vitest scope + busy + remove + empty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1881** |
| TB-1891 | Sign-in domains — humanize verificationStatus / enforcementMode enums | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — SAU ~48 |
| TB-1893 | Sign-in domains — in-page confirm for enable enforcement + recovery remove | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1891** |
| TB-1895 | Sign-in domains — Vitest enum labels + busy + confirms + empty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1891** |
| TB-1899 | Internal developer tools — Authority/ReadAuthority + internal-shell discovery honesty | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1896** |
| TB-1906 | Identity diagnostics — shell subtitle/intro not Configure job | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — SEI ~47 |
| TB-1907 | Identity diagnostics — StatusTag + humanize probe statuses | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1906**; pairs **TB-116** |
| TB-1908 | Identity diagnostics — collapse triple intro + strip Card density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1906** |
| TB-1909 | Identity diagnostics — loading/empty when strips not yet loaded | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1906** |
| TB-1910 | Identity diagnostics — Vitest shell honesty + StatusTag + loading | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1906** |
| TB-1911 | OIDC/JWT tab — title honesty (status/review, not in-page configuration) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — SOI ~44 |
| TB-1912 | OIDC/JWT tab — shell Configure subtitle override with **TB-1906** | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1911** |
| TB-1913 | OIDC/JWT tab — StatusTag for discovery status | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1911** |
| TB-1914 | OIDC/JWT tab — loading/empty + CTA hierarchy (wizard vs diagnostics) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1911** |
| TB-1915 | OIDC/JWT tab — Vitest title + shell + StatusTag + loading | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1911** |
| TB-1916 | Role mapping tab — status-hub honesty (not in-page editor) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — SEO ~43 |
| TB-1917 | Role mapping tab — shell Configure + duplicate intro/helper with **TB-1906** | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1916** |
| TB-1918 | Role mapping tab — StatusTag + illustrative example-group honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1916** |
| TB-1919 | Role mapping tab — protocol-aware CTAs (SAML vs OIDC) + loading | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1916** |
| TB-1920 | Role mapping tab — Vitest hub honesty + StatusTag + CTAs | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1916** |
| TB-1921 | SAML tab — Validate CTA is metadata fetch (label honesty) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — SSA ~52 |
| TB-1922 | SAML tab — in-page save confirm (drop window.confirm) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1921** |
| TB-1923 | SAML tab — shell Configure override + Card title density with **TB-1906** | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1921** |
| TB-1924 | SAML tab — DS Select + advanced regex disclosure + optional health strip | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1921** |
| TB-1925 | SAML tab — Vitest fetch label + confirm + shell | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1921** |
| TB-1930 | Model governance — Vitest error honesty + labels + chrome | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1926** |
| TB-1931 | Users API keys tab — job honesty (roles vs credential lifecycle) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — SEU ~45 |
| TB-1932 | Users API keys tab — execute primary Open API keys CTA with **TB-1213** | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1931** |
| TB-1933 | Users API keys tab — keys-specific error/empty (no principals / user-directory) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1931** |
| TB-1934 | Users API keys tab — column headers for automation keys + Link/Button | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1931** |
| TB-1935 | Users API keys tab — Vitest SEU deep-link + CTA + empty | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1931** |
| TB-1942 | Sealed records list — empty Browse reviews drop `projectId=default` | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1941** |
| TB-1944 | Sealed records list — dedupe Open review CTAs + page-1/100 + N+1 enrich | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1941** |
| TB-1945 | Sealed records list — Vitest empty href + row honesty + traffic note | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1941** |
| TB-2103 | Operator-curated model catalog — DDL-backed registry + internal curation surface | TECH_BACKLOG_OPEN.md; Maintainability P1 **V1.1** — ADR 0065 D2; deletes `ConfigAgentModelAliasRegistry`; first of the ADR 0065 train |
| TB-2105 | Engine evaluation evidence — attached and surfaced, **not gating** | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1.1** — ADR 0065 D3; reuses **TB-683** harness + judges; selection never refused on measured quality; explicit `NotEvaluated` |
| TB-2106 | Engine identity as first-class run provenance + replay diff | TECH_BACKLOG_OPEN.md; Traceability P1 **V1.1** — ADR 0065 D5; deliberately **not** in `ManifestHash` |
| TB-2109 | Non-Azure engine data-boundary gate — subprocessor disclosure + regulated-evidence acknowledgment | TECH_BACKLOG_OPEN.md; Compliance readiness P1 **V1.1** — ADR 0065 D11; must precede **TB-2108** / **TB-873** availability |
| TB-2110 | Two-tier engine selection — workspace allowed set + per-review user choice | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1.1** — ADR 0065 D13; bounds within-workspace engine variance; server-side enforcement of the allowed set |

#### Release readiness (141)

| ID | Technical item | Origin / qualification |
| --- | --- | --- |
| TB-1113 | Anti-CPA/3P-pen-test-as-pilot-trust-packet honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1112**; pairs **M-190** |
| TB-1120 | First security review PA one-pager ship-order contract | TECH_BACKLOG_OPEN.md; Commercial P1 **V1** — PA Q16; GTM **M-192**/**M-193** |
| TB-1122 | Isolation claims too strong vs INV-001 / ADR 0037 + RLS purge | TECH_BACKLOG_OPEN.md; Commercial P1 **V1** — PA Q18; GTM **M-194**/**M-195** |
| TB-1144 | SOC 2 / pen-test honest procurement talk-track contract | TECH_BACKLOG_OPEN.md; Commercial P1 **V1** — PA Q17 assurance talk; GTM **M-196**/**M-197** |
| TB-1147 | Jira page copy honesty — do not claim Set connection details | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1146** |
| TB-1149 | Jira issue type by severity — structured UI (no raw JSON) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1146** |
| TB-1150 | Jira empty composition — gate connection test + demote overrides | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1146**/**TB-1148** |
| TB-1164 | ServiceNow demote incident settings until credentials ready | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1161** |
| TB-1179 | Project deletion has no UI — governed delete affordance | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner recycle bin ~58/100; API DELETE exists |
| TB-1184 | Teams page — help as icon + caption in PageHeading actions | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner `/integrations/teams` 2026-07-25; with **TB-1178**/**TB-1183** |
| TB-1187 | Slack page — help as icon + caption in PageHeading actions | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1185**; parity **TB-1184** |
| TB-1193 | Webhooks page — help as icon + caption in PageHeading actions | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1191**; parity **TB-1184**/**TB-1187** |
| TB-1203 | Settings hub — demote Scope/Source/Status meta density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1198** |
| TB-1211 | Users & roles — tab-specific empty copy (no principals jargon) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1210** |
| TB-1251 | Demo/anonymous read plane vs paying-tenant structural isolation contract | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — PA Q10; GTM **M-217**/**M-218** |
| TB-1252 | Anti-AllowAnonymous-equals-safe / DemoScopes-pin-equals-catalog / empty-demo-scope honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1251**; pairs **M-217** |
| TB-1265 | `/live-demo` — honest sample-walkthrough title (not “Live demo”) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — owner live-demo ~61/100; traffic **LXX** |
| TB-1266 | `/live-demo` — first-viewport hero budget (start before disclosure wall) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1265** |
| TB-1267 | `/live-demo` — clarify journey vs `/see-it` (entry ladder) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1265**; pairs **TB-1028** |
| TB-1268 | `/live-demo` — compact stepper + early conversion CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1266** |
| TB-1269 | `/live-demo` — continuous-mode density (no five-panel dump) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1268** |
| TB-1280 | `/see-it` — honest time copy (not “30 seconds” for long page) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1279** |
| TB-1282 | `/see-it` — single CTA path + `/live-demo` ladder + purge manifest jargon | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1279**; pairs **TB-1267** |
| TB-1283 | `/see-it` — download label honesty (not “evidence bundle” for marketing PDF) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1279** |
| TB-1289 | Recycle bin — Administration wayfinding + PageHeading/help | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner STR re-review ~58/100; complements **TB-1179**–**TB-1182**; pairs **TB-1223** |
| TB-1295 | `/welcome` — single primary conversion path (demote CTA stack) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1294** |
| TB-1296 | `/welcome` — canonical proof CTA ladder (see-it vs demo/preview) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1294**; pairs **TB-1028**/**TB-1282**/**M-107** |
| TB-1298 | `/welcome` — honest see-it time copy (not “30 seconds”) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1294**; pairs **TB-1280** |
| TB-1300 | Anti-silent-sim-on-429 / queue-as-Real-success / labeled-sim-as-buyer-proof honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1299**; pairs **M-229** |
| TB-1301 | `/why` — first-viewport hero budget + primary conversion CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner why ~51/100; traffic **WHY** |
| TB-1302 | `/why` — canonical proof ladder (`/see-it` vs Contoso `/demo/preview`) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1301**; pairs **TB-1296**/**TB-1282**/**TB-1028**/**M-107** |
| TB-1305 | `/why` — honest pack/embed labels + closing conversion CTA | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1301**; pairs **TB-1283** |
| TB-1307 | `/why-archlucid` — disambiguate title/IA from marketing `/why` | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1306**; IA-014 |
| TB-1310 | `/why-archlucid` — PageHeading/help + pilot proof orientation | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1307** |
| TB-1319 | `/demo/explain` — buyer vocabulary (purge provenance/eng chrome) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner demo-explain ~51/100; traffic **DEX** |
| TB-1320 | `/demo/explain` — status banner honesty + quiet IDs | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1319** |
| TB-1322 | `/demo/explain` — IA gate or public proof ladder (IA-014) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1319**; pairs **TB-1307**/**TB-1251** |
| TB-1323 | `/demo/explain` — conversion CTA auth honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1319** |
| TB-1343 | WHAT_NOT_TO_PROMISE → UI/copy over-promise + highest buyer-risk page matrix | TECH_BACKLOG_OPEN.md; Commercial P1 **V1** — PA WNTP UI risk; GTM **M-239**/**M-240**; canonical table in `PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise` |
| TB-1344 | Anti-WNTP-forbidden-phrase-in-buyer-UI / billing-checkout-theater honesty CI | TECH_BACKLOG_OPEN.md; Testability P1 **V1** — after **TB-1343**; pairs **M-239** |
| TB-1355 | Core Pilot home checkpoint strip honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — PA Core Pilot happy path; GTM **M-241**/**M-242** |
| TB-1356 | Core Pilot first-session spine vocabulary unify (4/5/7) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1355**; pairs **TB-1331**/**TB-1007** |
| TB-1358 | Core Pilot happy-path stick + dishonest empty-state matrix contract | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — PA walkthrough; GTM **M-241**/**M-242** |
| TB-1359 | Anti-Core-Pilot-path-dishonesty honesty CI | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — after **TB-1358**; pairs **M-241** |
| TB-1361 | Evidence trail help — finding deep-link / `mode=` honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1360** |
| TB-1362 | Evidence trail help — Related guides density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1360**; pairs **TB-1258** |
| TB-1364 | Evidence trail help — Open sample / Load CTA chrome parity | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1360** |
| TB-1365 | Why-not-ChatGPT/Copilot 2-min talk track + live anchors contract | TECH_BACKLOG_OPEN.md; Commercial P1 **V1** — PA differentiation; GTM **M-243**/**M-244** |
| TB-1375 | First-hour help — purge Pilot / operator-path jargon + slug honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1374** |
| TB-1376 | First-hour help — inbound first-review pointers → core-pilot | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1374**; pairs **TB-1352**/**TB-1335** |
| TB-1377 | First-hour help — discovery / featured / search twin collapse | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1374** |
| TB-1378 | First-hour help — Vitest guard against product first-review CTA to first-hour | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1374** |
| TB-1395 | Repeat-review help — title/tier honesty (drop stickiness; product vs internal) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1394**; pairs **TB-1347**/**TB-1329** |
| TB-1397 | Repeat-review help — Related density + accelerator-chooser honesty | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1394**; pairs **TB-1258** |
| TB-1398 | Repeat-review help — loop-step deep-link CTA chrome | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1394** |
| TB-1400 | Review packages help — title/H1/slug/page-help label hierarchy | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1399**; pairs **TB-1026**/**TB-1260** |
| TB-1401 | Review packages help — TOC/anchor review-package → architecture-package honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1399** |
| TB-1402 | Review packages help — Related guides density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1399**; pairs **TB-1258** |
| TB-1403 | Review packages help — export jargon softener + sample/empty next-step CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1399**; pairs **TB-1028** |
| TB-1409 | `/admin/demo-readiness` — Internal Ops PageHeading + dedupe Demo readiness H1/H2 | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner ADD ~47/100; traffic **ADD** |
| TB-1411 | Demo readiness admin — tooling-disabled empty state next steps | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1409** |
| TB-1412 | Demo readiness admin — CTA hierarchy + loading polish | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1409** |
| TB-1413 | Demo readiness admin — check-row StatusTag status vs label honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1409**; pairs **TB-116** |
| TB-1414 | Specialty help chrome contract (shared root for ≤~50 HelpTopicMarkdownView surfaces) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — PA owner scoreboard ≤~50; GTM **M-251**/**M-252** |
| TB-1422 | `/admin/deployment-status` — Internal Ops PageHeading + help | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner ADE ~52/100; traffic **ADE** |
| TB-1486 | Compliance journey — doc-link honesty (help vs downloads) + buyer labels | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1483** |
| TB-1552 | Operator empty-state contract — document in UI_DESIGN_SYSTEM (+ UI ARCHITECTURE pointer) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner empty-state convention pass 2026-07-27; pairs **TB-1477**–**TB-1482** / **TB-1539** |
| TB-1572 | Operator side-rail contract — document in UI_DESIGN_SYSTEM (+ UI ARCHITECTURE pointer) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner side-rail convention pass 2026-07-27; pairs **TB-1552**–**TB-1556** / **TB-1477**–**TB-1482** |
| TB-1575 | Key operator hubs — side-rail inventory (allow working-object / master-detail / TOC; demote about) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — after **TB-1572** |
| TB-1579 | Alert rules Composite tab — demote secondary h2 under hub | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — GOC ~43/100 |
| TB-1584 | Alert rules Conditions tab — demote secondary h2 under hub | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — GLR ~50/100 |
| TB-1589 | Alert rules Test tab — demote dual Simulate/Tune h2 under hub | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — GOS ~47/100 |
| TB-1599 | Help catch-all — unknown slug → HelpTopicNotFoundView | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — HE. ~49/100 |
| TB-1600 | Help catch-all — topic loading skeleton + dynamic/static honesty | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1599** |
| TB-1601 | Help catch-all — default markdown fallthrough specialty-or-gated hook | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1599**; pairs **TB-1414** |
| TB-1602 | Help catch-all — traffic HE. router-meta / no double-count | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1599** |
| TB-1603 | Help catch-all — specialty dispatch inventory CI | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1599** |
| TB-1612 | Admin diagnostics help — Related eng deep-link demote | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1609** |
| TB-1617 | Authentication help — Related density + enterprise-onboarding honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1614** |
| TB-1618 | Authentication help — auth-shell inbound label align | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1614** |
| TB-1620 | Azure Boards help — setup-step deep links | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1619** |
| TB-1622 | Azure Boards help — Phase 1 / eng limitation jargon honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1619** |
| TB-1627 | Azure permissions help — first-viewport density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1626** |
| TB-1628 | Azure permissions help — Tier-1 / contract-version jargon honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1626** |
| TB-1629 | Azure permissions help — IA dual with Connect Azure securely | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1626** |
| TB-1630 | Azure permissions help — connection-context loading skeleton | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1626** |
| TB-1631 | `/help/caiq-sig-response` specialty buyer questionnaire guide | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — HCA ~41 |
| TB-1634 | CAIQ/SIG help — dual-doc dump / first-viewport density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1631** |
| TB-1635 | CAIQ/SIG help — Help Center + Trust / compliance-journey discovery IA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1631** |
| TB-1637 | Compare/replay help — Help Center tier honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1636** |
| TB-1638 | Compare/replay help — IA dual with repeat-review-loop | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1636** |
| TB-1639 | Compare/replay help — compare vs replay first-viewport job chrome | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1636** |
| TB-1640 | Compare/replay help — Related density + inbound labels | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1636** |
| TB-1646 | Operator populated-list contract — document in UI_DESIGN_SYSTEM (+ UI ARCHITECTURE pointer) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner populated-list convention pass 2026-07-27; pairs **TB-1552**–**TB-1556** / **TB-1572**–**TB-1576** / **TB-1539** |
| TB-1654 | Data-handling help — leaves/stays first-viewport job chrome | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — after **TB-1651** |
| TB-1655 | Data-handling help — Related + security-trust / Trust Center discovery | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — after **TB-1651** |
| TB-1660 | Tenant-isolation help — Vitest Three-layers load + anti-stub-only | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — after **TB-1656**; strengthen if needed |
| TB-1666 | Operator page contextual-help contract — document in UI_DESIGN_SYSTEM (+ UI ARCHITECTURE pointer) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner OPH inventory 2026-07-27; traffic **OPH**; pairs **TB-1184**/**TB-1458** (do not reopen) |
| TB-1671 | Operator inline-link affordance contract — document in UI_DESIGN_SYSTEM (+ UI ARCHITECTURE pointer) | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — owner OLA unstyled-link pass 2026-07-27; traffic **OLA**; pairs a11y baseline / **TB-1539** |
| TB-1675 | Vitest — bare navigational `<a>`/`<Link>` affordance allowlist + ban inherit-only body links | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — after **TB-1672**–**TB-1674**; pairs **TB-1671** / **TB-1556** / **TB-1576** / **TB-1650** / **TB-1665** / **TB-1670** |
| TB-1681 | `/help/evidence-only-review` specialty guide + Start review CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — HEV ~42; prefer Core Pilot specialty after **TB-1683** |
| TB-1686 | `/help/sponsor-summary` retarget SoT off FAQ dump → sponsor brief | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — EXE ~30 |
| TB-1687 | Sponsor-summary help — specialty guide + Open ROI/sponsor CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1686** |
| TB-1689 | Sponsor-summary help — fix in-app-doc-href catch-all mappings | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1686** |
| TB-1690 | Sponsor-summary help — title/body honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1686** |
| TB-1697 | Integration-readiness help — Help Center tier honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1696** |
| TB-1698 | Integration-readiness help — digests/advisory configure-href honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1696** |
| TB-1699 | Integration-readiness help — status-label first-viewport density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1696** |
| TB-1700 | Integration-readiness help — Related + Integrations hub IA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1696** |
| TB-1713 | Path-chooser help — branch primary CTAs | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1711** |
| TB-1714 | Path-chooser help — deferred ITSM + eng-help link honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1711** |
| TB-1715 | Path-chooser help — slug/title honesty + Related density | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1711** |
| TB-1716 | `/help/pilot-feedback` specialty Admin guide + Open Pilot feedback CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — HPE ~45 |
| TB-1718 | Pilot-feedback help — title honesty (drop 58R / Product learning H1 dual) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1716** |
| TB-1719 | Pilot-feedback help — IA dual with recommendation learning / pilot-nav | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1716** |
| TB-1720 | Pilot-feedback help — first-viewport job chrome | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1716** |
| TB-1722 | Pilot-guide workspace-nav — slug/pilot-nav jargon honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1721** |
| TB-1723 | Pilot-guide workspace-nav — Help Center catalog discovery | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1721** |
| TB-1724 | Pilot-guide workspace-nav — IA dual with first-architecture-review paths | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1721** |
| TB-1725 | Pilot-guide workspace-nav — Related density + sponsor-shell copy honesty | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1721** |
| TB-1732 | Prior-manifest help — manifest/retrieval jargon honesty | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1731** |
| TB-1734 | Prior-manifest help — IA dual with repeat-review / compare | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1731** |
| TB-1735 | Prior-manifest help — Related + finalize-success inbound copy | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1731** |
| TB-1737 | Sponsor-summary help — title honesty (sponsor brief vs product overview) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1736** |
| TB-1739 | Product-overview help — IA dual with sponsor-summary / path-chooser | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1736** |
| TB-1740 | Product-overview help — elevator/M-18 outreach dump vs overview job | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1736** |
| TB-1751 | `/help/subprocessors` specialty buyer register + Trust CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — HSU ~44 |
| TB-1753 | Subprocessors help — IA dual with DPA / Trust | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1751** |
| TB-1754 | Subprocessors help — title + Help Center discovery | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1751** |
| TB-1759 | Azure Boards page-help inbound → canonical `/help/azure-boards` | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1756** |
| TB-1765 | AWS cloud detail — copyable federation trust-policy starter | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1761** |
| TB-1768 | Azure cloud detail — page-help → `/help/cloud-connections/azure` | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1766** |
| TB-1783 | Atlassian OAuth callback — success copy + primary Open Jira CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1781** |
| TB-1814 | `/patterns` + detail — page-help topic map + contextual help mount | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1811** |
| TB-1844 | Diagram Mermaid/source disclosure honesty for buyer shell | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1841** |
| TB-1878 | Guided intake — purge admission-gate / Socratic jargon from buyer chrome | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — with **TB-1876** |
| TB-1884 | Account security — empty/inactive honesty + auth-help CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1881**; pairs **TB-1614** |
| TB-1894 | Sign-in domains — checklist/StatusTag + settings wayfinding + auth-help CTA | TECH_BACKLOG_OPEN.md; Adoption friction P1 **V1** — with **TB-1891** |
| TB-1896 | Internal developer tools — traffic honesty (gated / not buyer Settings) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — SED ~42 |
| TB-1900 | Internal developer tools — Vitest gate + catalog + CLI copy | TECH_BACKLOG_OPEN.md; Testability P2 **V1** — with **TB-1896** |
| TB-1941 | Sealed records list — traffic section honesty (not Marketing) | TECH_BACKLOG_OPEN.md; Trustworthiness P1 **V1** — SI ~50 |

### Medium

#### QA & stabilization (10)

| ID | Technical item | Origin / qualification |
| --- | --- | --- |
| Extractor parity | Cost, Advisor, orphans, NIC/PE inventory depth | securenow/TECHNICAL_BACKLOG.md; Same extractor discipline; SecureNow inventory workbenches consume output. |
| IDA / IDL / IDS / IDT | Inventory diagram layout and Graphviz forest | securenow/TECHNICAL_BACKLOG.md; Executive forest packing — see `.cursor/prompts/inventory-diagram-*-00-index.md`. Not a SecureNow-only codepath but blocks “all-day” diagram UX. |
| IE-RF | Relationship-first topology (network associations) | securenow/TECHNICAL_BACKLOG.md; Catalog-driven associations; complements diagrams — see [`AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) item 7. |
| SA-19/SA-20 | Entra Graph + CI federated adapters fail-soft | securenow/TECHNICAL_BACKLOG.md; Inventory files exist; Graph forbidden → warnings. Deep adapter work only on owner row. |
| SN-PE-regression | Golden fixtures for new association types | securenow/TECHNICAL_BACKLOG.md; Add AST tests when AX-DE catalog grows — do not reopen SN-PE collection. |
| SN-RT-ops | Hosted auto-pull includes new companions by default | securenow/TECHNICAL_BACKLOG.md; When operators expect LAW/SQL principal companions without Tier-1 flags — document in runbook first. |
| TB-686 | Semantic retrieval chunking | TECH_BACKLOG_OPEN.md; Cutting-edge AI P2 **V1**; gated on TB-595 |
| TB-872 | Customer-provided Azure OpenAI connection (first BYO path) | TECH_BACKLOG_OPEN.md; AI model chooser P2 **V1.1** |
| TB-872 | Customer-provided Azure OpenAI connection (first BYO path) | TECH_BACKLOG_OPEN.md; Cost-effectiveness P2 **V1.1** — re-sequenced to ship first by ADR 0065 D7; builds the per-tenant connection + Key Vault boundary later engines reuse |
| TB-2107 | Per-engine tokenizer + USD rate profiles | TECH_BACKLOG_OPEN.md; Cost-effectiveness P2 **V1.1** — ADR 0065 D6; after **TB-2103** |

#### Release readiness (2)

| ID | Technical item | Origin / qualification |
| --- | --- | --- |
| TB-879 | Pilot-feedback retrieval for planning materialize (RAG-V1.1-003) | TECH_BACKLOG_OPEN.md; Stickiness P2 **V1** |
| TB-880 | Cross-tenant pattern library UI (RAG-V1.1-004) | TECH_BACKLOG_OPEN.md; Explainability P2 **V1** |

#### 2.0 foundations (15)

| ID | Technical item | Origin / qualification |
| --- | --- | --- |
| FND-001 | Architecture capability map and bounded contexts | New proposal (not implemented); Define ArchLucid intelligence, SecureNow defense, shared platform, evidence, and governance ownership |
| FND-002 | Versioned cross-product contracts | New proposal (not implemented); Schema-first contracts, semantic versioning, compatibility and deprecation rules |
| FND-003 | Extension and plugin SDK contracts | New proposal (not implemented); Capability discovery, isolation, quotas, manifest validation, compatibility |
| FND-004 | Feature flags and experimental isolation | New proposal (not implemented); Disabled-by-default 2.0 experiments; build-time and runtime guards |
| FND-005 | Security evidence canonical schema | New proposal (not implemented); Evidence identifiers, source provenance, timestamps, confidence, retention |
| FND-006 | Finding identity and deduplication | New proposal (not implemented); Stable fingerprinting across scans, tenants, runs and code revisions |
| FND-007 | Remediation proposal schema | New proposal (not implemented); Typed changes, preconditions, blast radius, expected outcome, rollback |
| FND-008 | Verification outcome schema | New proposal (not implemented); Tests, attestation, regressions, confidence, residual risk and provenance |
| FND-009 | Audit event and trace correlation | New proposal (not implemented); End-to-end immutable audit correlation from discovery to approval |
| FND-010 | Authorization policy interface | New proposal (not implemented); RBAC/ABAC, approval classes, tenant boundaries, least privilege |
| FND-011 | Read-only architecture snapshot API | New proposal (not implemented); Versioned graph snapshots with freshness and evidence lineage |
| FND-012 | Risk model and exposure semantics | New proposal (not implemented); Exploitability, reachability, criticality, uncertainty, and evidence grades |
| FND-013 | Aspects measurement ledger interface | New proposal (not implemented); Reviewed unique LOC, distinct defects, verified fixes, trend provenance |
| FND-014 | Safe dry-run execution abstraction | New proposal (not implemented); No side effects; simulated plans and explicit environment capabilities |
| FND-015 | Rollout and rollback contract | New proposal (not implemented); Preflight, checkpoints, deployment policy, rollback evidence |

### Low

#### 2.0 foundations (63)

| ID | Technical item | Origin / qualification |
| --- | --- | --- |
| FND-016 | Enterprise topology graph ontology | New proposal (not implemented); Assets, identities, data, network, applications, trust edges |
| FND-017 | Architecture graph ingestion adapters | New proposal (not implemented); Azure first, AWS/GCP optional, provenance-preserving incremental updates |
| FND-018 | Declared vs observed topology reconciliation | New proposal (not implemented); Evidence reconciliation, drift and uncertain edges |
| FND-019 | Temporal graph and change history | New proposal (not implemented); Point-in-time topology, impact diff, lineage, snapshot retention |
| FND-020 | Attack-path representation | New proposal (not implemented); Authorized reachability and control-path modeling with confidence |
| FND-021 | Control and policy knowledge graph | New proposal (not implemented); Control coverage, compliance mappings, exceptions and ownership |
| FND-022 | Data sensitivity and blast-radius model | New proposal (not implemented); Classifications, data flows, dependency impact and safety-critical services |
| FND-023 | Identity privilege and trust graph | New proposal (not implemented); Workload identity, delegation, lateral-movement exposure and boundaries |
| FND-024 | Continuous asset discovery scheduler | New proposal (not implemented); Freshness SLAs, event-driven updates, backpressure and cost caps |
| FND-025 | Threat intelligence adapter contracts | New proposal (not implemented); Provenance, licensing, staleness and indicator validation |
| FND-026 | Defensive hypothesis and falsification engine | New proposal (not implemented); Test competing vulnerability hypotheses and report uncertainty |
| FND-027 | Remediation planner and dependency DAG | New proposal (not implemented); Order proposed fixes, prerequisites, conflicts and constraints |
| FND-028 | Remediation templates and policy packs | New proposal (not implemented); Parameterized infrastructure, application and configuration corrections |
| FND-029 | Sandboxed remediation executor | New proposal (not implemented); Isolated staging execution, network restrictions, explicit approvals |
| FND-030 | Autonomous controller state machine | New proposal (not implemented); Idempotent, resumable plan-act-verify cycle with bounded authority |
| FND-031 | Human-in-the-loop approval console | New proposal (not implemented); Impact summaries, explainability, approval evidence and separation of duties |
| FND-032 | Policy-as-code autonomy tiers | New proposal (not implemented); Observe, recommend, stage, approve, deploy; deny by default |
| FND-033 | Change conflict and concurrency manager | New proposal (not implemented); Detect concurrent edits, stale baselines, merge and cancellation |
| FND-034 | Verification harness for security corrections | New proposal (not implemented); Static/dynamic tests, regression tests, exploitability checks, rollback tests |
| FND-035 | Adversarial evaluation harness | New proposal (not implemented); Authorized simulated attack-vs-defense experiments and reproducible cohorts |
| FND-036 | Defensive advantage measurement | New proposal (not implemented); Time to exploitation versus verified remediation with censored outcomes |
| FND-037 | Risk reduction impact estimator | New proposal (not implemented); Estimate people protected with causal evidence and uncertainty bounds |
| FND-038 | False-positive and false-negative evaluation | New proposal (not implemented); Calibration, reviewer adjudication, coverage gaps and drift |
| FND-039 | Model governance and prompt-injection defenses | New proposal (not implemented); Trust boundaries, tool scopes, retrieval provenance and audit |
| FND-040 | Multi-model routing and model fallbacks | New proposal (not implemented); Evaluation-gated providers, budgets, latency and fail-closed behavior |
| FND-041 | Agent memory and learning safeguards | New proposal (not implemented); Evidence-backed updates, feedback review, drift and poisoning controls |
| FND-042 | Decision explanation and evidence citations | New proposal (not implemented); Reproducible rationale, source links and limitations |
| FND-043 | Cost-aware adaptive analysis | New proposal (not implemented); Compute budgets, information gain, staged depth and stop rules |
| FND-044 | What-if architecture simulation | New proposal (not implemented); Proposed-state graph changes, counterfactual impact, no production writes |
| FND-045 | Resilience and contingency analysis | New proposal (not implemented); N-1/N-2 dependencies, common-mode failures, critical service continuity |
| FND-046 | Architecture alternatives optimizer | New proposal (not implemented); Pareto tradeoffs across risk, cost, performance, compliance |
| FND-047 | Multi-tenant isolation verification | New proposal (not implemented); Cross-tenant tests, cryptographic boundaries and access audits |
| FND-048 | Secure secrets and connector credentials | New proposal (not implemented); Scoped short-lived tokens, rotation, vault isolation, redaction |
| FND-049 | Event bus and workflow durability | New proposal (not implemented); Outbox, retries, idempotency, ordering and dead-letter handling |
| FND-050 | Observability and SLO framework | New proposal (not implemented); Latency, remediation throughput, errors, queue depth, safety incidents |
| FND-051 | Disaster recovery and kill switch | New proposal (not implemented); Fail-safe stop, rollback, emergency disable, operator recovery |
| FND-052 | Data residency and privacy governance | New proposal (not implemented); Retention, deletion, minimization, regional routing and compliance |
| FND-053 | Customer onboarding and connector permissions | New proposal (not implemented); Least-privilege read-only bootstrap, consent and validation |
| FND-054 | Free-tier assessment isolation and quotas | New proposal (not implemented); Public-IP and architecture assessment, metering, anti-abuse controls |
| FND-055 | Subscription entitlements and packaging | New proposal (not implemented); Feature gates, metering, billing boundaries, upgrade path |
| FND-056 | Customer ROI and operational savings metrics | New proposal (not implemented); Verified hours saved, avoided exposure and economic outcomes |
| FND-057 | Open-core versus proprietary licensing decision | New proposal (not implemented); Assess licensing, IP, contribution policy and business incentives |
| FND-058 | Supply-chain security and signed artifacts | New proposal (not implemented); SBOM, SLSA-style provenance, dependency integrity and release signing |
| FND-059 | Independent benchmark and reproducibility kit | New proposal (not implemented); Representative datasets, repeatable scoring and third-party review |
| FND-060 | Architectural decision records and succession | New proposal (not implemented); ADRs, ownership, knowledge transfer and maintainability |
| TB-398 | Full enterprise ITSM connector | TECH_BACKLOG_OPEN.md; P3 **V2** |
| TB-687 | Prompt A/B iteration harness | TECH_BACKLOG_OPEN.md; P2 **V2** |
| TB-688 | Per-tier model-generation refresh cadence | TECH_BACKLOG_OPEN.md; P2 **V2** |
| TB-690 | Fine-tuning activation gate | TECH_BACKLOG_OPEN.md; P2 **V2** |
| TB-873 | Generic OpenAI-compatible endpoint adapter | TECH_BACKLOG_OPEN.md; P3 **V1.1/V2 boundary** — promoted by ADR 0065 D7; after **TB-872**; gates retained via ADR 0065 D3/D4 (**TB-2104**, **TB-2105**) |
| TB-883 | RAG-V2 live-model Graph-RAG ablation signal | TECH_BACKLOG_OPEN.md; P2 **V1**; Tier 3 hold |
| TB-886 | Surface tamper-evident manifest-verify in buyer-facing material | TECH_BACKLOG_OPEN.md; P3 **V1** (docs); cheapest early pilot-packet candidate |
| TB-932 | Offload large JSON payloads to blob storage | TECH_BACKLOG_OPEN.md; P3 **V2**; after **TB-929**–**TB-931** + measured sizes |
| TB-2108 | First non-Azure ArchLucid-managed engine adapter | TECH_BACKLOG_OPEN.md; P3 **V2**; ADR 0065 D1; gated on **TB-2103**–**TB-2107**, **TB-2109**, **TB-872** |
| TB-2408 | Paired engine-strength evaluation | TECH_BACKLOG_OPEN.md; P2 **V2**; candidate versus baseline cohort comparisons; no unsupported buyer-facing Elo |
| TB-2409 | Stable-conclusion gate for decision-grade findings | TECH_BACKLOG_OPEN.md; P1 **V2**; after **TB-2404**/**TB-2405** |
| TB-2410 | Ordered SecureNow remediation paths | TECH_BACKLOG_OPEN.md; P1 **V2**; extends **SA-10**/**SA-13** |
| TB-2411 | Adaptive analysis depth and compute budget | TECH_BACKLOG_OPEN.md; P2 **V2**; after verifier, falsification, and coverage semantics |
| TB-2412 | Proposed-state what-if planning | TECH_BACKLOG_OPEN.md; P2 **V2**; after **TB-2410**, **SA-12**, and **SA-13** |
| TB-2413 | N-1 and selective N-2 contingency propagation | TECH_BACKLOG_OPEN.md; P1 **V2**; after **TB-2410**, **SA-13**, and common-mode hypotheses |
| TB-2414 | Information-gain investigation order | TECH_BACKLOG_OPEN.md; P2 **V2**; after **TB-2411** and diagnostic hypotheses |
| TB-2415 | Pareto architecture alternatives | TECH_BACKLOG_OPEN.md; P2 **V2**; after **TB-2412** and **TB-2413** |
| TB-2416 | Requirements-constrained architecture synthesis | TECH_BACKLOG_OPEN.md; P3 **V2**; after **TB-2415**; not a current-product design guarantee |

## Acceptance and reconciliation checklist

- [ ] Compare all inherited items with current branch code and CI; remove newly verified completed items from this active file.
- [ ] Reconcile SecureNow SN-PERF-20–24 status conflict in source documents without re-opening shipped work.
- [ ] Establish current RC48 and master release-blocking CI status and elevate verified blockers to Immediate.
- [ ] Confirm SecureNow 1.0 public-IP and architecture assessment free-tier scope and release checks.
- [ ] Verify tenant isolation, authorization, evidence provenance, rollback and supportability before public launch.
- [ ] Write minimal ADRs for FND-001 through FND-015 without initiating major 2.0 implementation.
- [ ] Preserve original archive and historical source links.

## Founding reference

[ArchLucid and SecureNow 2.0 founding vision](ARCHLUCID_SECURENOW_2_0_FOUNDING_VISION.md).
