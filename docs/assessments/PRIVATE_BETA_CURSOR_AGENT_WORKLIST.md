> **Scope:** Founder/operator prescription — what to ask Cursor (and other coding agents) to do in the private-beta window, split into **ArchLucid-specific** and **generic launch** work. Derived from assessment posture as of **2026-09-13**; not a buyer deliverable.
> **Companion:** [`LATEST_GPT55.md`](LATEST_GPT55.md) (headline readiness) · [`LATEST_EXPOSURE.md`](LATEST_EXPOSURE.md) (controlled beta / public mention R/Y/G) · [`private_beta_access_prompt_07152026.md`](private_beta_access_prompt_07152026.md) (access-path assessment) · `/al-beta` (live trunk ranking command)

# Private-beta and launch — Cursor agent worklist

## Executive summary

ArchLucid is past “hide it because the UI is a prototype.” It is **not** past “strangers can click Start and we will look like a governed architecture company.”

| Signal | Status (2026-09-13 pass) |
| --- | --- |
| **(A) headline readiness** | **86.30%** — in-contract engineering is largely built |
| **Controlled beta** | **YELLOW** — founder-selected tenants + handholding only |
| **Public self-service** | **RED** — no unknown-user signup/pay |
| **Public mention** | **YELLOW** — request-access CTA; no live-looking seed screenshots |
| **Gate 1** (observed first review) | **UNKNOWN** — run `scripts/release-smoke.ps1` |
| **G4** (Real proof packets) | **HOLD — 0 of 3** |
| **Private-beta JwtBearer CI** | **Not yet observed green on `master`** |

**Central finding:** The scarce resource is **witnessing the machine** (smoke, invite path, Real packets, claim honesty), not building more platform surface.

**What to ask Cursor for:** run, prove, harden, and write the operator kit.

**What not to ask Cursor for:** new engines, MCP GA, Marketplace `Published`, Graph-RAG community summarization, CPA SOC 2 kickoff, third-party pen-test execution, or another ROI honesty-strip batch unless a buyer path is still lying.

**Standing command:** `/al-beta` — read-only ranking of the current top 10 (Human or Cursor) plus ≥15 Cursor suggestions from live trunk CI + assessment §8/§17.

---

## Category 1 — ArchLucid-specific

These tasks only make sense because of **this** product: governed reviews, JwtBearer invite wave, Real vs Simulator, G4 proof packets, WK-21 pack honesty, Quick Scan sample-only.

### 1A — Witness the cut (highest leverage)

| Item | Owner | Why now |
| --- | --- | --- |
| Run `scripts/release-smoke.ps1`; attach `artifacts/ship-gate-evidence/{runId}/` | Cursor runs; owner if staging creds | Gate 1 **UNKNOWN** |
| Triage `private-beta-access-on-push.yml` (JwtBearer invite → first review) | Cursor | Follow [`PRIVATE_BETA_TRUNK_SMOKE.md`](../runbooks/PRIVATE_BETA_TRUNK_SMOKE.md); frozen branch if trunk churn cancels runs |
| Refresh G5 Real-LLM artifact (`Invoke-RealLlmEvidenceGate.ps1`) | Owner executes; Cursor formats RC attach | G5 PASS but **2026-06-25** (stale) |
| G-REAL-06 / G-REAL-07 checklists and proof-log row formatting | Cursor drafts; **owner runs** Real pilots | G4 **0 of 3** — commercial bind |

**Copy-paste prompt:**

```text
Treat this as a private-beta witness pass, not a feature pass.
1) Run scripts/release-smoke.ps1 (or the closest Linux equivalent) and report Gate 1 PASS/FAIL with artifact paths.
2) Inspect the latest master run of private-beta-access-on-push.yml. If red, fix only blockers on invite → JwtBearer session → /reviews/new → row visible. Follow docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md.
3) Do not add engines, MCP, Stripe live keys, or Quick Scan AI.
```

### 1B — Invite-wave access path

Private beta here means: **invitation → authentication → correct tenant → Operator first meaningful action**, under **JwtBearer** (not `DevelopmentBypass` only).

| Proof | Reference |
| --- | --- |
| Six access proofs | [`private_beta_access_prompt_07152026.md`](private_beta_access_prompt_07152026.md) |
| JwtBearer / CI mint | [`LIVE_E2E_JWT_SETUP.md`](../library/LIVE_E2E_JWT_SETUP.md) |
| Recovery cases | Expired invite, expired session, wrong tenant, missing role, dead deep link — each must recover, not blank-loop |

**Copy-paste prompt:**

```text
Answer only: can an invited private-beta user get from invitation to first meaningful action under JwtBearer, and recover from expected failures?
Follow docs/assessments/private_beta_access_prompt_07152026.md. Confirm P0s by reproduction, not inference. Out of scope: polish, marketing, new features.
```

### 1C — Founder-led pilot kit (Cursor drafts; owner runs)

| Deliverable | Maps to |
| --- | --- |
| 30-minute spine script (ingest → policy ids → pack A/B → disposition → non-summing ROI → audit CSV) | Hostile-PA dismissal test; pack-delta moat |
| WK-21 talk track (“packs do not drive every engine”) | [`LATEST_GPT55.md`](LATEST_GPT55.md) §10–11 |
| One-page on-call triage card | [`FIRST_PILOT_SUPPORT_TRIAGE.md`](../runbooks/FIRST_PILOT_SUPPORT_TRIAGE.md) |
| G-REAL-09 DOCX eyeball checklist (Workspace B / Meridian / Alpine) | Owner opens the file |
| Quick Scan sample-only lint (marketing + UI) | **M-110** decision open; **TB-902** YELLOW |

**Copy-paste prompt:**

```text
Write a 30-minute founder demo script that makes the policy-pack moat obvious: same evidence, pack A vs pack B, different gate + sponsor headline, then export audit CSV.
Keep WK-21 honesty. Do not claim SOC 2 certified, live agents on Workspace B, or that Simulator dollars are savings.
Also produce a one-page first-pilot triage card from docs/runbooks/FIRST_PILOT_SUPPORT_TRIAGE.md.
```

### 1D — Claim and demo safety

Cheapest beta incident is **overclaim**, not a missing button.

Ask Cursor to:

- Diff landing / help / export covers against [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md) and Stage 0 allowlist ([`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md)).
- Confirm sendable covers stamp execution mode, pack, gate, WK-21, ROI non-summing.
- Confirm request-access CTA (not “sign up and pay”); Stripe stays labeled test/placeholder.
- Confirm Workspace B is never sold as live agents.

### 1E — Do not ask Cursor (ArchLucid)

| Excluded | Reason |
| --- | --- |
| New insight engines, Graph-RAG community summarization, MCP GA, Marketplace `Published` | [`LATEST_GPT55.md`](LATEST_GPT55.md) §16 Stop Doing List |
| **G-REAL-05** / **G-ASSURANCE-02** execution | Owner assurance programs; tech TB closed |
| **M-90 / M-44 / M-91 / M-92** | GTM V1.1 cohort rows — not engineering batches |
| `AnonymousExecutionEnabled` or live Stripe without owner decision | Exposure **RED** for self-service |
| Another ROI honesty-strip batch | Unless a specific buyer path still overclaims |

**Human-only (Cursor may draft paperwork):** three Real runs (**G-REAL-06**), invoice entity/tax (**G-COMMERCE-01**), Quick Scan go/no-go (**M-110**), polished screenshots (**M-07**), live DOCX visual (**G-REAL-09**), first paid SOW (**G-COMMERCE-02**).

---

## Category 2 — Generic launch

Applies to almost any private beta. ArchLucid already has pieces of several; ask Cursor to **inventory, close gaps, and make them operator-usable**.

### 2A — Golden path and rollback

| Task | Acceptance |
| --- | --- |
| Name the **one** success path (invite → first value in ≤30 min); defer everything else | Written go/no-go per RC |
| Rollback proof | Previous image/tag, feature-flag kill, “disable Real LLM / force Simulator” without full redeploy |
| Tenant offboarding | Disable login, stop spend, export data, delete/tombstone on request |

**Copy-paste prompt:**

```text
Inventory kill switches, feature flags, and rollback for a private-beta cut.
I need: (1) how to freeze Real LLM spend in <5 minutes, (2) how to roll back the last API+UI deploy, (3) how to disable a single tenant without touching others.
Cite existing runbooks/flags (e.g. docs/architecture/architecture_handbook/47-kill-switches-circuit-breakers.md). If a switch is documented but unwired, that is a P0.
```

### 2B — Cost, abuse, and capacity

| Task | Acceptance |
| --- | --- |
| Trace every path that can spend LLM, email, or storage without tight caps | Per-path cap + kill switch + user-visible failure |
| Rate limits on invite, signup, reset, Report Problem, public forms | Documented or implemented |
| “10 users this week” capacity note | SQL, worker queue, AOAI TPM — what breaks first |
| Incident paths | 429s, stuck runs, auth outage, cross-tenant suspicion |

**Copy-paste prompt:**

```text
Treat this as a launch cost-and-abuse review.
Find every path a beta user or anonymous visitor can cause unbounded LLM, email, or storage spend.
For each path: current cap, operator kill switch, and user-visible failure. Propose the smallest fix only where a cap is missing.
Do not enable new public AI.
```

### 2C — Observability for on-call

| Task | Reference |
| --- | --- |
| Five dashboards/alerts: API 5xx, auth failures, run stuck >N min, LLM spend vs budget, queue depth | [`INCIDENT_INVESTIGATION.md`](../runbooks/INCIDENT_INVESTIGATION.md) |
| Report Problem → queue with `correlationId` + `runId` | [`SUPPORT_PROBLEM_REPORT_TRIAGE.md`](../runbooks/SUPPORT_PROBLEM_REPORT_TRIAGE.md) |
| 15-minute incident comms template | [`INCIDENT_COMMUNICATIONS_POLICY.md`](../go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md) |
| Redacted support bundles before external share | [`FIRST_PILOT_SUPPORT_TRIAGE.md`](../runbooks/FIRST_PILOT_SUPPORT_TRIAGE.md) |

### 2D — Legal / trust paperwork (Cursor drafts; lawyer/owner signs)

| Artifact | Existing anchors |
| --- | --- |
| Beta terms, AUP, privacy, DPA, subprocessors, retention/deletion | [`PROCUREMENT_PACK_INDEX.md`](../go-to-market/PROCUREMENT_PACK_INDEX.md), [`trust-center.md`](../go-to-market/trust-center.md) |
| Security FAQ matching trust center (no invented SOC 2 / pen-test publication) | [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md) |
| Invite email + welcome + “how to get help” | [`SUPPORT_POLICY.md`](../go-to-market/SUPPORT_POLICY.md) |

### 2E — Support loop and feedback

| Task | Notes |
| --- | --- |
| First-week funnel metrics | invited → accepted → signed in → created run → finalized → exported |
| Lightweight usefulness signal on finalize/export only | Not a NPS campaign |
| Five canned replies | invite expired, run stuck, training-data question, empty export, SSO misconfigured |
| Known-issues doc for invitees | Simulator vs Real called out explicitly |

### 2F — Commercial and ops hygiene

| Task | Maps to |
| --- | --- |
| Invoice/SOW template gap check | **G-COMMERCE-01** |
| Data map (per tenant: what, where, how long, who sees it) | Procurement / trust pack |
| Secrets + dependency posture | CI gitleaks, Dependabot |
| Cut-freeze policy during first invite wave | Auth/smoke fixes only vs feature PRs |

**Copy-paste prompt (generic kit):**

```text
Generic private-beta launch kit, docs-first.
Produce: (1) invitee welcome + known-issues, (2) five support canned replies, (3) 11pm incident template, (4) first-week funnel metrics list mapped to existing telemetry if any, (5) gap list vs typical beta legal pack (terms, privacy, DPA, subprocessors) citing files that already exist.
Do not start SOC 2 CPA or a pen-test program.
```

---

## Recommended execution order

### Cursor (this week)

1. `/al-beta` — live trunk snapshot + ranked queue
2. Release-smoke / Gate 1 witness
3. Private-beta JwtBearer job green on `master`
4. Access-path recovery cases (§1B prompt)
5. Kill-switch + LLM-spend inventory (§2A–2B prompts)
6. Invitee welcome / known-issues / canned replies (§2E prompt)

### Owner (this week)

1. **2–5 named invitees** only (controlled beta definition)
2. **One Real extractor ZIP** toward **G-REAL-06**
3. **G-REAL-09** DOCX eyeball before demo video
4. Keep Quick Scan **sample-only** until **M-110**
5. No LinkedIn blast with unpaid screenshots until **M-07**

---

## Cross-references

| Topic | Doc |
| --- | --- |
| Private-beta CI triage | [`PRIVATE_BETA_TRUNK_SMOKE.md`](../runbooks/PRIVATE_BETA_TRUNK_SMOKE.md) |
| Founder 30-min pack A/B demo | [`FOUNDER_30_MIN_PACK_AB_DEMO_SCRIPT.md`](../go-to-market/FOUNDER_30_MIN_PACK_AB_DEMO_SCRIPT.md) |
| Invitee welcome kit | [`PRIVATE_BETA_INVITEE_WELCOME_KIT.md`](../go-to-market/PRIVATE_BETA_INVITEE_WELCOME_KIT.md) |
| Kill-switch / spend inventory | [`PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md`](../runbooks/PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md) |
| After-hours incident comms (15 min) | [`PRIVATE_BETA_INCIDENT_COMMS_15MIN.md`](../runbooks/PRIVATE_BETA_INCIDENT_COMMS_15MIN.md) |
| Legal/trust pack gap list | [`PRIVATE_BETA_LEGAL_PACK_GAP_LIST.md`](../go-to-market/PRIVATE_BETA_LEGAL_PACK_GAP_LIST.md) |
| One-page triage card | [`FIRST_PILOT_TRIAGE_CARD.md`](../runbooks/FIRST_PILOT_TRIAGE_CARD.md) |
| Access-path verdict (2026-09-14) | [`PRIVATE_BETA_ACCESS_PATH_VERDICT_20260914.md`](PRIVATE_BETA_ACCESS_PATH_VERDICT_20260914.md) |
| Claim audit (2026-09-14) | [`PRIVATE_BETA_CLAIM_AUDIT_20260914.md`](PRIVATE_BETA_CLAIM_AUDIT_20260914.md) |
| Gate 1 on Linux | [`RELEASE_SMOKE.md`](../library/RELEASE_SMOKE.md) § Linux / Cloud Agent |
| G-REAL-08 RC attach | [`scripts/ci/attach_g_real_08_rc_evidence.sh`](../../scripts/ci/attach_g_real_08_rc_evidence.sh) |
| Frozen-branch smoke | [`PRIVATE_BETA_FROZEN_BRANCH.md`](../runbooks/PRIVATE_BETA_FROZEN_BRANCH.md) |
| Gate 1 evidence | [`GATE_1_SHIP_GATE_EVIDENCE.md`](../runbooks/GATE_1_SHIP_GATE_EVIDENCE.md) |
| Three Real proof runs | [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) |
| GTM proof-gated rows | [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) (**G-REAL-06**, **G-REAL-07**, **M-07**, **M-110**) |
| Agent repo guidance | [`engineering/AGENTS.md`](../engineering/AGENTS.md) |
| Assessment scope (do not penalize `(A)` for CPA SOC 2 / pen test) | `.cursor/rules/Assessment-Scope-V1_1.mdc` |

---

## Document history

| Date | Change |
| --- | --- |
| 2026-09-14 | Initial worklist recorded from founder Cursor planning session (assessment-derived prescription). |
