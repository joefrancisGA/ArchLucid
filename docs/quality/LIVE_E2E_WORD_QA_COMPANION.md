# ArchLucid Live E2E — Manual QA Companion (Word source)

**Purpose:** Human-readable manual test material derived from Playwright live API + SQL specs (`archlucid-ui/e2e/live-api-*.spec.ts`, demo-workspace smoke, marketing live specs). Use alongside automated CI job **`ui-e2e-live`** and **`docs/quality/MANUAL_QA_CHECKLIST.md`** for judgment, sponsor narrative, and real-auth staging checks.

**Last generated for Word export:** 2026-06-30 (maintainers: regenerate when spec titles or route matrix change).

---

## How to open this in Microsoft Word

Pick one:

1. **Word 365 / recent Word:** File → Open → select this `.md` file. Word converts headings and tables.
2. **Pandoc (best formatting):** `pandoc docs/quality/LIVE_E2E_WORD_QA_COMPANION.md -o LiveE2E-ManualQA.docx`
3. **Copy-paste:** Open in any Markdown viewer, copy sections into a blank Word doc, apply Heading 1/2 styles.

**Recording results in Word:** Add columns *Pass / Fail / Blocked / Tester / Date / Build / Notes* to each table, or attach this doc to a test cycle in your test-management tool.

---

## 1. What these tests represent

| Aspect | Detail |
|--------|--------|
| **Stack** | Real **ArchLucid.Api** + **SQL Server** + **Next.js architect workspace** (not mock API) |
| **Auth (default CI job)** | **DevelopmentBypass** — not production Entra ID |
| **Agents** | **Simulator** — no real LLM; output quality is not scored |
| **CI posture** | **`ui-e2e-live`** is **warn-only** on full CI; failures are visible but do not fail the workflow |
| **RC / GA cuts** | **`@release-gate`** demo-workspace specs are **blocking** on `rc-release-gate.yml` |

**Automated twin:** `npx playwright test` from `archlucid-ui/` with API + SQL up (see §2).

---

## 2. Manual run prerequisites (parity with CI)

| Requirement | Typical value |
|-------------|---------------|
| API base URL | `http://127.0.0.1:5128` (`LIVE_API_URL`) |
| UI base URL | `http://127.0.0.1:3000` |
| SQL catalog | Empty or migrated DB the API can boot against |
| API auth mode | `ArchLucidAuth:Mode=DevelopmentBypass` |
| Agent mode | `AgentExecution:Mode=Simulator` |
| Convenience script | `.\scripts\release-smoke-live-ui-sql.ps1` (from repo root) |

**Fixture IDs used in URLs below:**

| Symbol | Resolved value |
|--------|----------------|
| Showcase review | `claims-intake-modernization` |
| Showcase finding | `phi-minimization-risk` |
| Fixture review (seeded) | `e2e-fixture-run-001` |
| Fixture manifest | `f0000001-0000-4000-8000-000000000001` |
| Empty-artifacts manifest | `f0000002-0000-4000-8000-000000000002` |
| Showcase static manifest | `a1c2e3f4-a5b6-7890-abcd-ef1234567890` |
| Policy pack slug | `healthcare-claims-v3-pack` |
| Planning plan slug | `claims-intake-modernization-plan` |

---

## 3. Golden path — operator happy path (manual script)

**Automated source:** `e2e/live-api-journey.spec.ts`  
**Scenario name:** *operator happy path: create → execute → commit → manifest → export → governance → audit*

| Step | Action (manual) | Expected result |
|------|-----------------|-----------------|
| 1 | Confirm API health: open or call `GET /health/ready` | HTTP 200, API ready |
| 2 | Create a new architecture review (UI **New review** or API `POST /v1/architecture/request`) | Receive a **run ID**; review appears in list |
| 3 | Execute the review (`POST …/execute` or UI equivalent) | Run progresses through agent/simulator pipeline |
| 4 | Wait until run status is **Ready for commit** | Poll run detail until commit is allowed |
| 5 | Commit the review | Golden manifest created; status **Committed** |
| 6 | Open **Reviews list** → **Review detail** | **Golden manifest** / signed record link visible |
| 7 | Open **Manifest / signed record** detail | Manifest heading, artifacts table, **Download bundle (ZIP)** |
| 8 | Download export ZIP (`GET /v1/artifacts/runs/{runId}/export`) | Non-empty ZIP; audit event **RunExported** |
| 9 | Submit governance approval (`POST /v1/governance/approval-requests`) | Approval request created |
| 10 | Negative check: approve as **same actor** who submitted | **400** self-approval blocked (soft expectation in automation) |
| 11 | Approve with a **different reviewer** (e.g. `e2e-peer-reviewer`) | Status **Approved** |
| 12 | Negative check: approve again on same request | **400** invalid transition |
| 13 | Search audit by run ID | Events include **RunStarted**, **ManifestGenerated**, **GovernanceApprovalSubmitted**, **GovernanceApprovalApproved**, **RunExported**; correlation IDs present |
| 14 | UI: **Governance** with run loaded | Approval card shows **Approved** |
| 15 | UI: **Audit** — search by run ID | Results render; no error alert |

---

## 4. Scenario catalog — all live E2E tests (human titles)

Use **Pass / Fail / Notes** when executing manually. **API** = mostly API calls; **UI** = browser; **Both** = mixed.

### 4.1 Core operator journeys

| ID | Spec file | Scenario | Type | What to verify |
|----|-----------|----------|------|----------------|
| J-01 | live-api-journey | Operator happy path (full spine) | Both | §3 above |
| J-02 | live-api-conflict-journey | Second commit idempotent (200, same manifest version) | Both | No extra **ManifestGenerated** audit; UI still **Committed** |
| J-03 | live-api-conflict-journey | Commit unknown run → 404 `#run-not-found` | API | Problem details type |
| J-04 | live-api-governance-rejection | Submit → reject → audit → UI **Rejected**; invalid transitions 400 | Both | **GovernanceApprovalRejected** in audit |
| J-05 | live-api-core-pilot-path | Home, new request, reviews list, showcase deliverables | UI | Core pilot surfaces load |
| J-06 | live-api-buyer-golden-path | Five-step diligence spine, no generic error | UI | Buyer golden path @smoke |
| J-07 | live-api-smoke | Pilot spine: shell, baseline ZIP wizard, execute, findings | Both | Real proxy, no mocks |
| J-08 | live-api-smoke | Policy pack assignment + operator policy packs page | Both | Effective set visible |
| J-09 | live-api-smoke | Authority compare + compare page hydrate | Both | Scoped run vs demo workspace A |
| J-10 | live-api-socratic-intake | Guided intake UI → draft → clarifications → spawned review | Both | First-use intake path |
| J-11 | live-api-socratic-intake | Draft API: create → admit → skip MUST → submit | API | Returns run id |
| J-12 | live-api-review-manifest-roundtrip | Showcase outcome link → manifest → breadcrumb back | UI | `/reviews/claims-intake-modernization` |
| J-13 | live-api-compare-runs | Two committed runs → compare API + compare page | Both | `#compare-structured` panel |
| J-14 | live-api-compare-runs | Compare with missing right run → 404 | API | |
| J-15 | live-api-whitelabel-export | Showcase whitelabel consulting export → DOCX download | UI | Modal + packaging fields |

### 4.2 Governance, policy, alerts, digests

| ID | Spec file | Scenario | Type | What to verify |
|----|-----------|----------|------|----------------|
| G-01 | live-api-policy-pack-lifecycle | Create → assign → effective → UI → audit **PolicyPackCreated** | Both | `/governance/policy-packs` |
| G-02 | live-api-alert-rules | Create alert rule, list, alerts page renders | Both | `/alerts` |
| G-03 | live-api-digest-webhook | Digest subscription create → list → toggle + audit | API | **DigestSubscriptionCreated/Toggled** |
| G-04 | live-api-digest-webhook | Webhook dry-run (documented: no HTTP surface) | N/A | Manual: skip or worker-only |
| G-05 | live-api-advisory-flow | Schedule advisory scan after commit + audit | API | **AdvisoryScanScheduled/Executed** |
| G-06 | live-api-replay-export | Replay committed run + export + audit | API | **ReplayExecuted**, **RunExported** |
| G-07 | live-api-analysis-report | Analysis report + audit | API | **ArchitectureAnalysisReportGenerated** |
| G-08 | live-api-email-run-to-sponsor | Post-commit PDF from first-value-report Markdown | Both | Sponsor-facing download |

### 4.3 Search, graph, sponsor, marketing

| ID | Spec file | Scenario | Type | What to verify |
|----|-----------|----------|------|----------------|
| M-01 | live-api-search-ask-graph | List by systemName; graph API; Ask; `/search` and `/ask` | Both | Optional Ask non-2xx OK in CI |
| M-02 | live-api-sponsor-board-pack | Sponsor summary orphan/freshness; board-pack markdown | API | |
| M-03 | live-api-sponsor-board-pack | Portfolio summary deduplicates findings | API | |
| M-04 | live-api-why-archlucid | Proof page sections backed by live API | UI | `/why-archlucid` |
| M-05 | live-api-marketing-pricing-quote | POST quote request 204; pricing page confirmation | Both | |
| M-06 | live-api-marketing-pricing-stripe-checkout | Team tier Stripe hidden until real checkout URL | UI | |
| M-07 | live-api-marketing-showcase | GET marketing showcase JSON or 404 | API | |
| M-08 | marketing-demo-preview | `/demo/preview` manifest narrative + signup CTA | UI | No auth |
| M-09 | marketing-accessibility-public | `/accessibility` Last reviewed from ACCESSIBILITY.md | UI | |

### 4.4 Trial and signup

| ID | Spec file | Scenario | Type | What to verify |
|----|-----------|----------|------|----------------|
| T-01 | live-api-trial-end-to-end | Register → UI → limits → expiry → checkout → activate → metrics | Both | Self-serve trial spine |
| T-02 | live-api-trial-signup | POST /v1/register provisions org (201) | API | |
| T-03 | live-api-trial-signup | Local-identity register when routes exposed | API | |
| T-04 | live-api-trial-signup | UI: signup → verify → onboarding → sample run → manifest | Both | DevelopmentBypass |
| T-05 | live-api-trial-signup | Trial funnel metrics after register + billing + convert | API | |

### 4.5 Error, negative, concurrency, auth

| ID | Spec file | Scenario | Type | What to verify |
|----|-----------|----------|------|----------------|
| E-01 | live-api-error-states | Run detail problem UI for non-existent run | UI | |
| E-02 | live-api-error-states | Reviews list renders (empty OK) | UI | |
| E-03 | live-api-error-states | Audit no-results search, no crash | UI | |
| E-04 | live-api-error-states | Governance dashboard loads | UI | |
| E-05 | live-api-negative-paths | Self-approval blocked 400 + audit | Both | `#governance-self-approval` |
| E-06 | live-api-negative-paths | Unknown run GET → 404 `#run-not-found` | API | |
| E-07 | live-api-negative-paths | Unknown run execute/commit → 404 | API | |
| E-08 | live-api-negative-paths | Malformed run id → 400 or 404 | API | |
| E-09 | live-api-negative-paths | Second commit on committed run → 409 | API | |
| E-10 | live-api-negative-paths | Health ready with 1ms timeout fails | API | Negative |
| E-11 | live-api-negative-paths | Empty JSON create → 400 or 422 | API | |
| E-12 | live-api-concurrency | Parallel first commit: no 5xx; ends Committed | API | |
| E-13 | live-api-concurrency | Parallel governance approve: one 2xx, one 4xx | API | Single **GovernanceApprovalApproved** |
| E-14 | live-api-rate-limit-smoke | 429 returns problem+json rate-limit-exceeded | API | |
| E-15 | live-api-archival | Archival no HTTP trigger (documented skip) | N/A | Worker-driven |
| E-16 | live-api-archival | Multiple committed runs visible on list | API | |
| E-17 | live-api-auth-parity-spine | Create → execute → list under current auth | API | |

**ApiKey lane** (`live-api-apikey-auth.spec.ts` — CI job `ui-e2e-live-apikey`):

| ID | Scenario |
|----|----------|
| AK-01 | `/health/ready` anonymous 200 |
| AK-02 | GET runs without key → 401 |
| AK-03 | GET runs invalid key → 401 |
| AK-04 | GET runs valid admin key → 200 |
| AK-05 | Readonly key: GET 200; POST create → 403 |

**JWT lane** (`live-api-jwt-auth.spec.ts` — CI job `ui-e2e-live-jwt`):

| ID | Scenario |
|----|----------|
| JWT-01 | `/health/ready` anonymous 200 |
| JWT-02 | GET runs without bearer → 401 |
| JWT-03 | GET runs invalid bearer → 401 |
| JWT-04 | GET runs valid JWT → 200 |
| JWT-05 | POST create with valid JWT |
| JWT-06 | Audit actor aligned with JWT name claim |

### 4.6 Demo workspaces (@release-gate — RC blocking)

| ID | Spec file | Scenario | What to verify |
|----|-----------|----------|----------------|
| RC-A | demo-workspace-a.smoke | Product Tour reviewer shell: evidence, findings, finalized record, exports | GA demo workspace A |
| RC-B | demo-workspace-b.smoke | Regulated storyline: Pack A/B findings, severities, consulting DOCX, whitelabel JSON | GA demo workspace B |

### 4.7 Accessibility (automated axe → manual augmentation)

**Automated:** `live-api-accessibility.spec.ts` — axe WCAG 2.2 AA; critical/serious violations fail.  
**Default CI subset:** 28 routes (`@live-a11y-pr`). **Full matrix:** 69 routes (`@live-a11y-full-matrix`).

**Manual augmentation (required for release-quality a11y):** keyboard-only pass, 200% zoom, reduced motion, NVDA/VoiceOver spot check — see `docs/quality/MANUAL_QA_CHECKLIST.md` § A.9 and `docs/quality/ACCESSIBILITY_MANUAL_SPOT_CHECK_EVIDENCE.md`.

**Focus / announcer tests** (`live-api-accessibility-focus.spec.ts`):

| ID | Scenario | Manual check |
|----|----------|--------------|
| A11Y-F1 | Skip link → focus on main content | Tab to skip link, Enter |
| A11Y-F2 | Client navigation → focus on main | Navigate between routes |
| A11Y-F3 | Route announcer updates | Listen / inspect live region |
| A11Y-F4 | axe baseline in dark mode | Toggle dark theme, visual scan |

---

## 5. Route walk matrix (page-by-page manual smoke)

**Instructions:** Log in (or DevelopmentBypass). Visit each URL. Record **Pass / Fail / Notes**. For each page: main content visible, no uncaught error banner, primary heading sensible, no obvious layout break.

| # | Page name | URL path |
|---|-----------|----------|
| 1 | Overview | `/` |
| 2 | Welcome marketing | `/welcome` |
| 3 | Why ArchLucid marketing | `/why` |
| 4 | Compliance journey marketing | `/compliance-journey` |
| 5 | Pricing marketing | `/pricing` |
| 6 | Trial signup | `/signup` |
| 7 | Onboarding (canonical) | `/onboarding` |
| 8 | Legacy getting-started redirect | `/getting-started` |
| 9 | Legacy onboarding/start redirect | `/onboarding/start` |
| 10 | Legacy /onboarding redirect | `/onboarding` |
| 11 | Legacy /onboard redirect | `/onboard` |
| 12 | New request | `/reviews/new` |
| 13 | Reviews list (canonical) | `/reviews?projectId=default` |
| 14 | Run detail (fixture) | `/reviews/e2e-fixture-run-001` |
| 15 | Run provenance (fixture) | `/reviews/e2e-fixture-run-001/provenance` |
| 16 | Finding detail (showcase) | `/reviews/claims-intake-modernization/findings/phi-minimization-risk` |
| 17 | Finding inspect (showcase) | `/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect` |
| 18 | Manifest detail | `/signed-records/f0000001-0000-4000-8000-000000000001` |
| 19 | Manifest (empty artifacts fixture) | `/signed-records/f0000002-0000-4000-8000-000000000002` |
| 20 | Compare | `/compare` |
| 21 | Replay | `/replay` |
| 22 | Replay (prefilled showcase) | `/replay?runId=claims-intake-modernization` |
| 23 | Ask | `/ask` |
| 24 | Search | `/search` |
| 25 | Advisory | `/advisory` |
| 26 | Graph | `/graph` |
| 27 | Audit | `/governance/audit` |
| 28 | Policy packs (hub) | `/governance/policy-packs` |
| 29 | Alerts inbox (hub) | `/governance/alerts` |
| 30 | Alerts — rules tab | `/alerts?tab=rules` |
| 31 | Alerts — notifications tab | `/governance/alert-rules?tab=notifications` |
| 32 | Alerts — simulation tab | `/alerts?tab=simulation` |
| 33 | Alerts — composite tab | `/alerts?tab=composite` |
| 34 | Sponsor Workspace Health | `/governance/dashboard` |
| 35 | Governance workflow | `/governance` |
| 36 | Policy resolution | `/governance/standards-and-rules` |
| 37 | Governance findings queue | `/governance/findings` |
| 38 | Planning | `/planning` |
| 39 | Planning plan detail | `/planning/plans/claims-intake-modernization-plan` |
| 40 | Digests | `/digests` |
| 41 | Digest subscriptions tab | `/digests?tab=subscriptions` |
| 42 | Settings exec digest tab | `/digests?tab=schedule` |
| 43 | Workspace settings | `/administration/settings/tenant` |
| 44 | Settings baseline | `/administration/settings/baseline` |
| 45 | Review feedback | `/product-learning` |
| 46 | Advisory scheduling | `/advisory-scheduling` |
| 47 | Recommendation learning | `/recommendation-learning` |
| 48 | Impact preview | `/insights/impact-preview` |
| 49 | Scorecard | `/insights/architecture-scorecard` |
| 50 | Value report | `/value-report` |
| 51 | Value report pilot | `/value-report/pilot` |
| 52 | ROI summary | `/value-report/roi` |
| 53 | Help | `/help` |
| 54 | Settings security & trust | `/administration/settings/security-trust` |
| 55 | Why ArchLucid (operator) | `/why-archlucid` |
| 56 | Demo explain | `/demo/explain` |
| 57 | Microsoft Teams integration | `/integrations/teams` |
| 58 | Settings users | `/administration/settings/users` |
| 59 | Role management | `/settings/roles` |
| 60 | Settings support | `/administration/settings/support` |
| 61 | Admin health | `/admin/health` |
| 62 | Admin configuration | `/admin/configuration` |
| 63 | Sponsor reviews list | `/sponsor/reviews` |
| 64 | Sponsor scorecard | `/sponsor/scorecard` |
| 65 | Sponsor run detail (showcase) | `/sponsor/reviews/claims-intake-modernization` |
| 66 | Sponsor finding (showcase) | `/sponsor/reviews/claims-intake-modernization/findings/phi-minimization-risk` |
| 67 | Compare (fixture pair) | `/compare?leftRunId=e2e-fixture-left-run&rightRunId=e2e-fixture-right-run` |
| 68 | Operator sign in | `/auth/signin` |
| 69 | Marketing accessibility | `/accessibility` |
| 70 | Marketing privacy | `/privacy` |
| 71 | Marketing get started | `/get-started` |
| 72 | Manifest (showcase static UUID) | `/signed-records/a1c2e3f4-a5b6-7890-abcd-ef1234567890` |
| 73 | Policy pack detail | `/governance/policy-packs/healthcare-claims-v3-pack` |
| 74 | Demo preview | `/demo/preview` |

**Deferred from automated axe (manual only if seeded):**

| Page | Why deferred |
|------|--------------|
| `/governance/approval-requests/{id}/lineage` | Needs persisted approval request id |
| `/auth/callback` | Needs real OIDC `code` / `state` |
| `/reviews/e2e-fixture-run-001/findings/e2e-finding-001` | May 404 on live SQL without mock finding slug |

---

## 6. What automation cannot replace (add from manual checklist)

Merge **`docs/quality/MANUAL_QA_CHECKLIST.md`** into your Word pack for:

- Sponsor / architect **narrative coherence** (Claims Intake demo story)
- **Real Entra ID**, Marketplace, Stripe TEST on staging
- **Assistive technology** beyond axe
- **Alert fatigue** and sponsor readability judgments
- **On-call runbook** readability

---

## 7. References

| Document | Path |
|----------|------|
| Live E2E spec index + sequence diagram | `docs/library/LIVE_E2E_HAPPY_PATH.md` |
| Comprehensive manual QA | `docs/quality/MANUAL_QA_CHECKLIST.md` |
| A11y manual spot check | `docs/quality/ACCESSIBILITY_MANUAL_SPOT_CHECK_EVIDENCE.md` |
| Demo workspace anchors | `docs/go-to-market/DEMO_WORKSPACES.md` |
| CI block vs warn | `docs/runbooks/CI_RELEASE_GATE.md` |
| RC blocking live parity | `docs/runbooks/RC_RELEASE_GATE.md` |

---

*End of Word source document.*
