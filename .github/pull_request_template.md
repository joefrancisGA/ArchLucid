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

<!-- These prompts are advisory: they help reviewers and authors catch common
     mistakes and are not required CI gates. Check N/A when a prompt does not
     apply. -->

- [ ] **Change shape:** I identified whether this change affects API contracts, persistence/migrations, authorization/tenant scope, audit events, or user-visible copy.
- [ ] **Write endpoints:** For each new or changed mutation, I checked authentication, authorization, tenant/workspace scope, input validation, idempotency/concurrency, and the expected audit event. See [`docs/engineering/DEFECT_PREVENTION_GUARDRAILS.md`](../docs/engineering/DEFECT_PREVENTION_GUARDRAILS.md).
- [ ] **Tenant isolation:** If data access changed, I considered same-tenant success, cross-tenant denial, missing-scope denial, and object-not-found behavior.
- [ ] **Migrations:** If schema or data shape changed, I documented forward compatibility, rollback/recovery, backfill behavior, and whether old and new application versions can overlap.
- [ ] **Verification notes:** I recorded the most useful local command or manual scenario for reviewers, even when no automated test was added.
- [ ] **Bug fix / state changes:** I captured the failing scenario and considered adjacent boundary cases, retries/concurrency, and relevant UI states (loading, empty, error, permission-denied, stale, and double-submit).
- [ ] **Configuration / dependencies:** If configuration or dependencies changed, I considered safe defaults, validation, secrets/logging, release notes, transitive versions, and rollback.
- [ ] **Specialized guardrails:** If applicable, I considered feature flags, authorization outcomes, caching, background jobs, integrations, import/export safety, accessibility, dependency lifetimes, and rollout/recovery.
- [ ] **Boundary / operations:** If applicable, I considered nullability, serialization, pagination, cancellation/timeouts, resource disposal, localization, file safety, test-data isolation, event evolution, and operational diagnosis.
- [ ] **Defect learning:** If this fixes a defect or changes a boundary, I captured the triggering scenario, destructive-operation/recovery behavior, identifier and invariant assumptions, changed defaults, and any reusable regression lesson.
- [ ] **Developer safeguards:** If applicable, I considered deterministic tests, fault injection, API deprecation, rate limits/backpressure, telemetry cardinality, secret rotation, feature interactions, and existing pattern examples.

- [ ] OpenAPI / client surfaces updated if wire contract changed (see `docs/library/API_CONTRACTS.md` and workspace rules). Architecture or infrastructure API merges that fail `.NET: OpenAPI v1 contract snapshot (fail-fast)` need `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh` from repo root (see `docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md`).
- [ ] **Proof / sponsor surfaces:** If this PR touches first-pilot proof, sponsor PDF/Markdown, or sponsor exports, read [`docs/library/ARCHITECTURE_INVARIANTS_ONE_PAGE.md`](docs/library/ARCHITECTURE_INVARIANTS_ONE_PAGE.md) and keep evidence → finding → manifest → artifact → audit labeling honest.
- [ ] Tests or linters run locally for touched areas.
- [ ] **UI performance cut:** If this PR is a bundle / CWV / First Load JS change, cite field p75 from [`docs/runbooks/FIELD_WEB_VITALS_TRIAGE.md`](docs/runbooks/FIELD_WEB_VITALS_TRIAGE.md) (or note “no field data yet — lab/First Load JS only”) and which cluster it targets (**TB-2021** / **TB-2022** / **TB-2023** / **TB-935** / …).
- [ ] **Demo workspaces / GA gate:** Does this PR change evidence capture, findings display, buyer run-detail shells, consulting/DOCX export surfaces, seeded demo manifests/policy payloads, or operator scope behavior? If **yes**, run **`cd archlucid-ui` → `npm exec playwright test --grep "@release-gate"`** (recommended on the PR branch) **and**, after merge, rely on **`ci.yml` `ui-e2e-live`** when it runs (**`push`** / **`merge_group`** / **`workflow_dispatch`**, not **`pull_request`**, per workflow `if:`). Update **`DemoSeedService` / parity tests / `demo-workspace-live-scope`** in **this PR** when stable IDs/content move — see **`docs/go-to-market/DEMO_WORKSPACES.md`** § *Living fixtures*.
