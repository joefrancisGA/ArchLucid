> **Scope:** Customer-facing — First architecture review walkthrough (operator UI) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# First architecture review walkthrough (operator UI)

## Objective

Give operators a **linear checklist** for creating the first **architecture review** using the **New review** wizard at **`/reviews/new`** (legacy **`/runs/new`** may redirect), without relying on screenshots (which go stale quickly).

## Assumptions

- The UI is available at **`/reviews/new`** (see **[`FIRST_RUN_WIZARD.md`](FIRST_RUN_WIZARD.md)** for design intent).
- The API is reachable with a configured auth mode — see **[`SECURITY.md`](SECURITY.md)** and **[`PILOT_GUIDE.md`](PILOT_GUIDE.md)**.

## Constraints

- This walkthrough does not replace **[`LIVE_E2E_HAPPY_PATH.md`](LIVE_E2E_HAPPY_PATH.md)** for HTTP-level scripted parity or **[`onboarding/day-one-developer.md`](../onboarding/day-one-developer.md#following-the-request-past-create-execute--commit--retrieval--ask)** for the request-to-answer narrative spine.

## Steps

1. **Open the shell** — Sign in per your environment (Entra, API key, or DevelopmentBypass in local dev only).
2. **Navigate to New review** — Use **`/reviews/new`** or the primary nav entry **New review** (Core Pilot home hints link here by default).
3. **Pick a preset or template** — Choose the closest sample if you are evaluating; customize fields only where you have real system facts.
4. **Complete each wizard step** — Advance only when required fields validate; note inline errors reference **`correlationId`** when the proxy surfaces API failures — see **[`TROUBLESHOOTING.md`](../TROUBLESHOOTING.md)**.
5. **Submit** — The wizard calls **`POST /v1/architecture/request`**; capture the returned **run id** (review session id; API and routes still use `run`) from the success path or list.
6. **Execute and commit** — From **review detail**, drive **Execute** then **Commit** when the pipeline reports **Ready for commit** — see **[`operator-shell.md`](operator-shell.md)**.
7. **Verify artifacts** — Confirm manifest + artifacts appear; use **Compare**/**Replay** only after you have two committed reviews or an export need — see **[`V1_SCOPE.md`](V1_SCOPE.md)**.
8. **Attach to your workflow (optional)** — After commit, run **`collect-first-pilot-proof.ps1`** and attach artifacts to GitHub or Azure DevOps per **[`V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md`](../runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md)**. CI manifest-delta: **[`GITHUB_ACTION_MANIFEST_DELTA.md`](../integrations/GITHUB_ACTION_MANIFEST_DELTA.md)** · **[`AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md`](../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md)**.

## Related

- **[`FIRST_RUN_WIZARD.md`](FIRST_RUN_WIZARD.md)** — design and UX notes.
- **[`PILOT_GUIDE.md`](customer-facing/PILOT_GUIDE.md)** — pilot-facing scope and support boundaries.
- **[`operator-shell.md`](operator-shell.md)** — operator shell patterns and empty states.
- **[`V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md`](../runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md)** — V1 embedded workflow story (no V1.1 connectors).
