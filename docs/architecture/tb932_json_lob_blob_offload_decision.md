# TB-932 — JSON LOB → blob offload decision

**Backlog:** TB-932 (P0, evidence-gated)  
**Peers:** TB-929–TB-931 / TB-2119 (Done) — list/detail already avoid most fat JSON.  
**Measurement script:** `powershell -File scripts/ops/measure-json-lob-payload-sizes.ps1`  
**SQL:** `scripts/ops/sql/tb932-json-lob-size-distribution.sql`

## Environment measured

| Field | Value |
| --- | --- |
| Date (UTC) | 2026-08-09 |
| Environment | **Azure DEV** (`archlucid-dev.database.windows.net`) — no separate staging stack |
| Database | `ArchLucid` (platform catalog empty for measured LOBs); **`ArchLucidTenantDev`** (tenant data) |
| Row volume notes | Small pilot sample: 8 agent results, 8 finding payloads, 6 findings snapshots; no `TraceJson` / comparison rows present |

## Size distribution (DEV tenant `ArchLucidTenantDev`)

| Source | Rows | Avg bytes | Max bytes | % ≥1 MB |
| --- | ---: | ---: | ---: | ---: |
| AgentResults.ResultJson | 8 | 1045 | 1304 | 0.00 |
| FindingRecords.PayloadJson | 8 | 3739 | 13698 | 0.00 |
| FindingsSnapshots.FindingsJson | 6 | 18200 | 30382 | 0.00 |
| AgentExecutionTraces.TraceJson | 0 | — | — | — |
| ComparisonRecords.PayloadJson | 0 | — | — | — |

`ArchLucid` (non-tenant) returned empty result sets for these LOB sources.

## Decision

Choose **one**:

- [x] **Won't do (close TB-932)** — p95/max stay sub-MB (max ~30 KB) and % ≥1 MB is 0 after TB-929/930/2119; blob offload ops cost not justified on current DEV data.
- [ ] **Proceed to implement** — multi-MB LOB IO is a proven bottleneck (document p95 and % ≥1 MB above). Next: SQL metadata + private blob container + dual-read migration (see TB-932 approach in `TECH_BACKLOG.md`).

## Rationale (2–5 sentences)

DEV tenant LOBs top out around **30 KB** (`FindingsJson`), with **zero** rows ≥1 MB. Hot-path list/detail work already shipped under TB-929/930/2119, so SQL LOB offload would add storage/ops cost for no measured gain. Re-open only if a later staging/prod cohort shows multi-MB p95 or material % ≥1 MB.

## Owner sign-off

| Role | Name | Date |
| --- | --- | --- |
| Agent measurement on ArchLucid DEV | Cursor agent (owner-authorized DEV) | 2026-08-09 |
