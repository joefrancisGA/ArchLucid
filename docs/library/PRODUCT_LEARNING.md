> **Scope:** Product learning (pilot feedback) — operator & product owner guide (58R) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Product learning (pilot feedback) — operator & product owner guide (58R)

**Audience:** Operators and product / architecture owners reviewing how ArchLucid outputs are received in a pilot.

**Not the same as** **Learning** in the operator shell ([operator-shell.md](operator-shell.md)): that page is **recommendation learning** (advisory acceptance weights). **Pilot feedback** (this doc) is **cross-cutting judgment** on runs, manifests, and artifacts, stored per tenant/workspace/project.

---

## 1. How data is captured

- Each **signal** is a **human judgment**: trust, reject, revise, follow-up, etc., plus **subject** (what was rated), optional **pattern key**, optional short **comment**, and optional link to an **architecture run**.
- Rows are stored in **`ProductLearningPilotSignals`** (SQL when `ArchLucid:StorageProvider` is **`Sql`**). Scope is always **tenant + workspace + project** (same headers/claims as other operator APIs: `x-tenant-id`, `x-workspace-id`, `x-project-id`, or defaults in Development).
- **Nothing in 58R auto-changes** prompts, rule packs, or agents from this data.
- **Insert paths today:** operator UI feedback controls call **`POST /v1/product-learning/signals`** for findings, manifest artifacts, and sponsor/review packages. Application integration can also write through the product-learning repository. Empty dashboards mean no rows in scope or no users have submitted feedback yet.

**Conventions:** Do not put secrets or credentials in free-text fields.

### 1.1 In-product feedback controls

The operator shell captures four dispositions:

| UI label | Stored disposition | Use when |
|----------|--------------------|----------|
| **Trusted** | `Trusted` | The finding, artifact, or review package is usable as-is. |
| **Needs revision** | `Revised` | The output is directionally useful but needs edits or clearer structure. |
| **Rejected** | `Rejected` | The output is misleading, unusable, or not relevant. |
| **Follow up** | `NeedsFollowUp` | The output raised a real question or action that product / architecture owners should triage. |

Current pilot-facing surfaces:

- Finding explainability rows and finding detail pages.
- Manifest artifact rows on review detail.
- The sponsor / pilot scorecard package banner after finalization.

Each submission stores the current tenant/workspace/project scope, optional run identifiers when the run id is a GUID, subject type, artifact hint, pattern key, optional short comment, and actor display/key from the authenticated request. Comments are intentionally short and should not contain secrets, credentials, customer private data beyond the reviewed architecture context, or personal notes unrelated to product learning.

---

## 2. View the learning dashboard (UI)

1. Run the API and [operator UI](OPERATOR_QUICKSTART.md#operator-ui) (`archlucid-ui`, `.env.local` → `ARCHIFORGE_API_BASE_URL`).
2. Open **http://localhost:3000** → nav **Q&A & advisory** → **Pilot feedback** (`/product-learning`).
3. Choose **Time range** (all time, 30 days, 7 days) and **Refresh** if needed.

Each full load issues **four** read requests to the API (summary, opportunities, trends, triage) with the same `since` filter so panels stay aligned.

You will see:

| Section | Purpose |
|--------|---------|
| **Summary** | Signal and run counts, rollup/trend/opportunity/triage counts, expandable API notes. |
| **Trusted vs rejected / revised** | Table of **artifact**-level counts (trusted, revised, rejected, follow-up, runs). |
| **Top improvement opportunities** | Ranked **candidates** for product review (not auto-filed tickets). |
| **Triage queue** | Merged **next steps** (opportunities plus repeated-comment themes that crossed thresholds). |

If counts are zero, scope has no signals yet or the time window filters everything out.

---

## 3. Review top improvement opportunities

- In the UI, read **title**, **severity**, **area**, and **summary**; use **Repeated theme** when present as a hint, not as NLP truth.
- **Ordering is deterministic** on the server (same inputs → same order). Use **Priority rank** as a **review order**, not a promise of engineering priority.
- **API (same scope headers):** `GET /v1/product-learning/improvement-opportunities` — optional query `since`, `maxOpportunities` (see Swagger).

---

## 4. Export triage summaries

**In the UI (same page):** under **Export for triage**, use **Download Markdown**, **Download JSON**, or **Open JSON in new tab**. Exports respect the **same time range** as the dashboard.

**API:**

| Goal | Call |
|------|------|
| Markdown body inside JSON | `GET /v1/product-learning/report?format=markdown` |
| Structured JSON | `GET /v1/product-learning/report?format=json` |
| Download file | `GET /v1/product-learning/report/file?format=markdown` or `format=json` |

Optional: `since` (ISO 8601), `maxReportArtifacts`, `maxReportImprovements`, `maxReportTriage` (bounds enforced — see Swagger).

Exports are **short, human-readable rollups**: totals, artifact outcome table, problem-area bullets, improvement lines, triage preview. **Raw comments are not dumped** into exports by design.

---

## 4.1 Persist planning drafts from opportunities (59R)

When you want **named themes** and **improvement plans** in the 59R tables (for exports, KPIs, or handoff to your own backlog tooling), an operator with **ExecuteAuthority** can materialize a **bounded** draft set from the same ranked opportunities the dashboard uses:

- **`POST /v1/learning/planning/materialize`** — optional query **`since`** (ISO 8601, same semantics as other product-learning reads), **`maxPlansToMaterialize`** (default **10**, max **50**).
- **Deterministic:** same scoped inputs produce the same derivation and priority ordering; existing theme keys are skipped (idempotent).
- **Evidence:** new plans link **pilot feedback signals** only (capped per plan) — not automatic “prove it” links to every architecture run.
- **Still no auto-adaptation:** this path does **not** change prompts, rule packs, agents, or governance — same rule as §1.
- **Operator shell (V1 GA):** **`PlanningBridgePanel`** on **`/product-learning`** — see **§4.2**.

---

## 4.2 Planning bridge — in-shell UX (**V1 GA**)

Canonical product/requirements spec for improvement **#16** in weighted assessments (**P7** answered **2026-05-15**). Supersedes “wait for external Figma” for V1 — **ASCII wireframes** and **behavioral acceptance** live here; optional Figma polish is non-blocking.

#### Objective

Give operators with **ExecuteAuthority** a **first-class, honest** path inside the operator shell to turn **Pilot feedback** triage into **59R planning themes and plans** without dropping to raw API calls, while preserving **determinism**, **idempotency**, and **no auto-mutation** of prompts, agents, or governance (**§4.1**, **§1**).

#### Assumptions

- **`POST /v1/learning/planning/materialize`** and **`ProductLearningPlanningMaterializeResult`** remain the **only** persistence path for V1 GA (no second “shadow” writer).
- The **Pilot feedback** dashboard already loads **summary, opportunities, trends, triage** with a shared **`since`** filter (**§2**).
- **`/planning`** remains a **read-only** aggregation view; the bridge **initiates** materialization from **`/product-learning`**, then routes the operator to **`/planning`** to inspect results (**`archlucid-ui`** `PlanningPageView` today).

#### Constraints

- **Authority:** **`ExecuteAuthority`** only — mirror controller policy (**`LearningController`**); hide or disable the bridge for lesser roles with **`OperatorShellMessage`** / tooltip explaining RBAC.
- **Bounded workload:** Respect API clamps — **`maxPlansToMaterialize`** default **10**, max **50** (same as **`LearningPlanningQueryParser`**).
- **No new persistence semantics:** Do **not** add prompts, agents, rule-pack mutations, or LLM calls in the bridge — UI is a thin orchestration over existing APIs.
- **Backend surface (owner engineering judgment — V1 GA):** **Do not** add a **`planning/materialize/preview`** endpoint for V1 GA. **`ProductLearningPlanningMaterializeResult`** already returns **`ThemesInserted`**, **`PlansInserted`**, **`SkippedExistingThemeKeys`**, **`SignalLinksInserted`** — sufficient for success UX. Materialization is **idempotent** (existing **`ThemeKey`** rows are skipped); the UI must explain that **re-running** may show **zeros** or high **`SkippedExistingThemeKeys`**. Defer **`GET` preview / dry-run** to a later slice **only** if buyer-led usability testing proves insufficient signal from POST-only flows.

#### Architecture overview

Add a **`PlanningBridgePanel`** (name flexible) on **`/product-learning`** below **Top improvement opportunities** (or adjacent to **Export for triage** — choose one stable placement per implementation).

The panel runs a **three-step** cognitive model:

1. **Align scope** — inherit **`since`** from the dashboard time-range control (same semantics as **`GET /v1/product-learning/improvement-opportunities`**). Show read-only **opportunity count** from already-loaded client state **or** one lightweight **`GET`** if the dashboard store does not expose it — **do not** duplicate four-panel reload logic.
2. **Confirm caps** — numeric **`maxPlansToMaterialize`** (default **10**, clamp **1–50**) with helper text referencing **§4.1** bounds.
3. **Materialize** — **`POST /v1/learning/planning/materialize?since=…&maxPlansToMaterialize=…`**; render **`ProductLearningPlanningMaterializeResult`** as a **`role="status"`** summary; primary **Next** → **`/planning`** (deep link as today).

#### Component breakdown (UI)

| Concern | Direction |
|---------|-----------|
| **Layout** | Reuse **`OperatorShellMessage`**, **`OperatorApiProblem`**, existing button / input tokens from **`/product-learning`** sections. |
| **State** | Client-side: `idle` \| `submitting` \| `success` \| `error`; reset `success` banner on **`since`** or cap change. |
| **Copy** | Use **materialize** / **draft plans** language — avoid implying auto-backlog filing or Jira/ServiceNow sync. Cross-link **§4.1** behavior in a short **“What this does”** `<details>` or footnote. |
| **Empty paths** | If **no opportunities** in scope, disable primary button; **`OperatorTryNext`** points at widening **time range** or capturing signals on findings. |
| **Demo mode** | If **`PlanningPageView`** blocks demo (**59R requires live API**), the bridge panel must **also** hide or show the same demo-static **`OperatorDemoStaticBanner`** posture — never pretend materialize succeeded offline. |

#### Data flow

```text
/product-learning (existing dashboard fetch(es))
       │
       ▼
PlanningBridgePanel ──POST──► /v1/learning/planning/materialize
       │                              │
       │◄──── JSON ProductLearningPlanningMaterializeResult ────┘
       ▼
Success banner + link to /planning ──GET──► existing planning list loaders
```

Correlation IDs: propagate from **`OperatorApiProblem`** on **`4xx`/`5xx`** — same as other operator mutations.

#### Security model

- **RBAC:** UI gated by **`ExecuteAuthority`** claim/policy parity with **`LearningController.MaterializePlanningDrafts`** — **no** client-side-only obscurity.
- **Tenant isolation:** Same **`x-tenant-id` / `x-workspace-id` / `x-project-id`** (or JWT-derived defaults) as other **`archlucid-ui`** operator calls — **no** cross-tenant preview.
- **Audit:** Successful **`POST`** already emits **`ProductLearningPlanningMaterialized`** — UI does **not** need duplicate audit rows; optional **`learning.planning_materialize_clicked`** analytics event is implementation-choice (**must not** log secrets).

#### Operational considerations

- **Tests:** At minimum **Vitest** unit tests on query-string assembly + result formatting; **Playwright** happy-path optional when **`ui-e2e-live`** harness has **`ExecuteAuthority`** persona — align with **`release-smoke`** norms.
- **Docs:** Keep OpenAPI (**`GET /openapi/v1.json`**) authoritative for parameter spelling; update **`API_CONTRACTS.md`** only if narrative drift appears.
- **Rollout:** Feature-flag optional (**environment or appsettings**) — default **on** for production-like staging when **`LearningController`** route is enabled.

---

## 5. How product / architecture owners should use this

| Do | Avoid |
|----|--------|
| Use the dashboard and export in **triage meetings** to agree on themes (quality, clarity, repeat rejects). | Treat ranks as **automatic backlog priority** or model-driven scores. |
| Tie themes to **concrete artifacts or workflows** (diagrams, manifest sections, export formats). | Over-interpret **short comment prefixes** (they are deterministic string rollups, not semantic clustering). |
| Feed conclusions into your normal **planning / RFC / bug** process with human judgment. | Expect the system to **mutate** production config from pilot feedback. |

---

## 6. Related docs

| Doc | Notes |
|-----|--------|
| [archive/CHANGE_SET_58R.md](../archive/CHANGE_SET_58R.md) | Objectives, constraints, component list, full prompt log (historical). |
| [DATA_MODEL.md](DATA_MODEL.md) | `ProductLearningPilotSignals` table overview. |
| [API_CONTRACTS.md](API_CONTRACTS.md) | General HTTP behavior, auth, correlation ID. |
| [operator-shell.md](operator-shell.md) | Overall UI navigation patterns. |
| **§4.2 (this doc)** | Planning bridge PRD — **`/product-learning`** → **`POST …/materialize`** → **`/planning`** (**V1 GA**). |

**Tests:** Filter `ChangeSet=58R` or `FullyQualifiedName~ProductLearning` — see [TEST_STRUCTURE.md](TEST_STRUCTURE.md).
