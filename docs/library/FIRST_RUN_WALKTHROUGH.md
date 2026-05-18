> **Scope:** First architecture review walkthrough (operator UI) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# First architecture review walkthrough (operator UI)

## Objective

Give operators a **linear checklist** for creating the first **architecture review** using the **New review** wizard (legacy routes may still show **New run** / `/runs/new`), without relying on screenshots (which go stale quickly).

## Assumptions

- The UI is available at **`/runs/new`** (see **[`FIRST_RUN_WIZARD.md`](FIRST_RUN_WIZARD.md)** for design intent).
- The API is reachable with a configured auth mode — see **[`SECURITY.md`](SECURITY.md)** and **[`PILOT_GUIDE.md`](PILOT_GUIDE.md)**.

## Constraints

- This walkthrough does not replace **[`LIVE_E2E_HAPPY_PATH.md`](LIVE_E2E_HAPPY_PATH.md)** for HTTP-level scripted parity or the archived **[`ONBOARDING_HAPPY_PATH_2026_04_17.md`](../archive/ONBOARDING_HAPPY_PATH_2026_04_17.md)** spine.

## Steps

1. **Open the shell** — Sign in per your environment (Entra, API key, or DevelopmentBypass in local dev only).
2. **Navigate to New review** — Use **`/runs/new`** or the primary nav entry **New review** (legacy: **New run**).
3. **Pick a preset or template** — Choose the closest sample if you are evaluating; customize fields only where you have real system facts.
4. **Complete each wizard step** — Advance only when required fields validate; note inline errors reference **`correlationId`** when the proxy surfaces API failures — see **[`TROUBLESHOOTING.md`](../TROUBLESHOOTING.md)**.
5. **Submit** — The wizard calls **`POST /v1/architecture/request`**; capture the returned **run id** (review session id; API and routes still use `run`) from the success path or list.
6. **Execute and commit** — From **review detail**, drive **Execute** then **Commit** when the pipeline reports **Ready for commit** — see **[`operator-shell.md`](operator-shell.md)**.
7. **Verify artifacts** — Confirm manifest + artifacts appear; use **Compare**/**Replay** only after you have two committed reviews or an export need — see **[`V1_SCOPE.md`](V1_SCOPE.md)**.

## Related

- **[`FIRST_RUN_WIZARD.md`](FIRST_RUN_WIZARD.md)** — design and UX notes.
- **[`PILOT_GUIDE.md`](PILOT_GUIDE.md)** — pilot-facing scope and support boundaries.
- **[`operator-shell.md`](operator-shell.md)** — operator shell patterns and empty states.
