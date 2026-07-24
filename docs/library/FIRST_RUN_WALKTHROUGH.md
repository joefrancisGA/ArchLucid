> **Scope:** Customer-facing — First architecture review walkthrough (architect workspace).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# First architecture review walkthrough

## Objective

Give architects a **linear checklist** for creating the first **architecture review** using **New architecture review** at **`/reviews/new`** (legacy **`/runs/new`** may redirect), without relying on screenshots (which go stale quickly).

## Assumptions

- The UI is available at **`/reviews/new`** (see **[`FIRST_RUN_WIZARD.md`](FIRST_RUN_WIZARD.md)** for design intent).
- Sign-in works for your tenant — see **[Authentication and sign-in](/help/authentication-sign-in)** and **[Pilot guide](/help/pilot-guide)**.

## Constraints

- This walkthrough does not replace **[`LIVE_E2E_HAPPY_PATH.md`](LIVE_E2E_HAPPY_PATH.md)** for HTTP-level scripted parity or **[`onboarding/day-one-developer.md`](../onboarding/day-one-developer.md#following-the-request-past-create-execute--commit--retrieval--ask)** for the request-to-answer narrative spine.

## Steps

1. **Open the workspace** — Sign in with work/school account, email one-time code, or your organization's SSO.
2. **Navigate to New architecture review** — Use **`/reviews/new`** or the primary nav entry **New architecture review**.
3. **Pick a preset or template** — Choose the closest sample if you are evaluating; customize fields only where you have real system facts.
4. **Complete each wizard step** — Advance only when required fields validate; note inline errors reference a correlation id when the UI surfaces API failures — see **[Troubleshooting](/help/troubleshooting)**.
5. **Submit** — Capture the returned review id from the success path or **Reviews** list.
6. **Execute and finalize** — From **review detail**, drive **Execute**, then **Finalize** when the pipeline reports **Ready to finalize** — see **[Workspace navigation](/help/pilot-nav-profile)**.
7. **Verify the architecture package** — Confirm the signed review record and artifacts appear; use **Compare**/**Replay** only after you have two finalized packages or an export need — see **[Architecture packages](/help/review-packages)**.
8. **Attach to your workflow (optional)** — After finalize, collect sponsor proof per **[Pilot guide](/help/pilot-guide)** when your team uses GitHub or Azure DevOps handoff.

<details>
<summary>Administrator details — CLI and HTTP</summary>

- Create path may call **`POST /v1/architecture/request`** (API still uses `run` identifiers).
- Proof collectors: **`collect-first-pilot-proof.ps1`** and workflow handoff docs under `docs/runbooks/`.
- Contributor shell patterns: [`operator-shell.md`](operator-shell.md).

</details>

## Related

- **[Your first architecture review](/help/core-pilot)** — guided first-session checklist.
- **[`FIRST_RUN_WIZARD.md`](FIRST_RUN_WIZARD.md)** — design and UX notes.
- **[Pilot guide](/help/pilot-guide)** — pilot-facing scope and support boundaries.
- **[Workspace navigation](/help/pilot-nav-profile)** — sidebar and first-review path.
