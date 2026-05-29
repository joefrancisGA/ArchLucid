## Summary

<!-- What changed and why (short). -->

## Required CI checks (branch protection)

Org admins: add **exact** GitHub check names (as shown on a green Actions run) under **Rules → Required status checks**.

Agent / offline eval gates (`.github/workflows/ci.yml` — dedicated jobs for discoverability):

| Display name (copy into required checks) |
| --- |
| `CI: prompt-injection regression (strict + block layer)` |
| `CI: agent offline regression (eval corpus + prompt JSON baseline)` |

See also `.github/BRANCH_PROTECTION.md`.

## Checklist

- [ ] OpenAPI / client surfaces updated if wire contract changed (see `docs/library/API_CONTRACTS.md` and workspace rules).
- [ ] **Proof / sponsor surfaces:** If this PR touches first-pilot proof, sponsor PDF/Markdown, or executive exports, read [`docs/library/ARCHITECTURE_INVARIANTS_ONE_PAGE.md`](docs/library/ARCHITECTURE_INVARIANTS_ONE_PAGE.md) and keep evidence → finding → manifest → artifact → audit labeling honest.
- [ ] Tests or linters run locally for touched areas.
- [ ] **Demo workspaces / GA gate:** Does this PR change evidence capture, findings display, buyer run-detail shells, consulting/DOCX export surfaces, seeded demo manifests/policy payloads, or operator scope behavior? If **yes**, run **`cd archlucid-ui` → `npm exec playwright test --grep "@release-gate"`** (recommended on the PR branch) **and**, after merge, rely on **`ci.yml` `ui-e2e-live`** when it runs (**`push`** / **`merge_group`** / **`workflow_dispatch`**, not **`pull_request`**, per workflow `if:`). Update **`DemoSeedService` / parity tests / `demo-workspace-live-scope`** in **this PR** when stable IDs/content move — see **`docs/go-to-market/DEMO_WORKSPACES.md`** § *Living fixtures*.
