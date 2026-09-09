> **Scope:** Coding agents extending or reviewing this repository — monorepo layout, **`*.slnf`** filters, and assessment/context pointers — not buyer-facing hosted-SaaS onboarding.

# Repository guidance for coding agents

## Monorepo layout

| Area | Path | Scoped agent doc |
|------|------|------------------|
| Backend / .NET hosts | Root `ArchLucid.*` projects, `ArchLucid.sln` | This file + `.cursor/rules/Navigation.mdc` |
| Web app | **`archlucid-ui/`** | **`archlucid-ui/AGENTS.md`** |
| Docs spine | **`docs/`** | `docs/START_HERE.md`; **`docs/archive/` is historical only** — do not index navigation or regenerated digests against it unless comparing history. Builders: `docs/engineering/` |

Full build and CI alignment: **`docs/engineering/BUILD.md`**.

## Local git hooks (recommended once per clone)

Install shared hooks so common CI guards run before commit:

```powershell
pwsh scripts/install-git-hooks.ps1
```

The **`pre-commit`** hook runs a **scoped** mutating-controller audit only when staged files include **`ArchLucid.Api/Controllers/*Controller.cs`** (full-repo scan is ~20s+ on Windows — use **`ARCHLUCID_PRE_COMMIT_FULL_AUDIT=1`** only when needed). It syncs the route/tier/policy/nav registry for the same controller changes (see **`docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md`**). Skip once: **`ARCHLUCID_SKIP_PRE_COMMIT=1 git commit`**. If the hook reports **`python: command not found`**, set **`git config --local archlucid.python "C:/Python313/python.exe"`** (or your install path) or **`ARCHLUCID_PYTHON`** for the session.

The **`pre-push`** hook runs the same OpenAPI v1 + buyer snapshot check as CI **`openapi-contract-snapshot`** when outgoing commits touch API-contract paths (aligned with **Refresh OpenAPI v1 snapshot** path filters). Skip once: **`ARCHLUCID_SKIP_OPENAPI_PRE_PUSH=1 git push`**. Repeat runs reuse a repo-local NuGet cache under **`.cache/nuget-packages`** and MSBuild incremental **`obj/`/`bin/`** outputs — see **`docs/library/OPENAPI_CONTRACT_DRIFT.md`**.

## Reduce context before deep reads

- **Assessments / readiness passes:** **`docs/library/REPO_DIGEST.md`** (skim; regenerate with **`python scripts/repo_digest/build_repo_digest.py`**), **`docs/library/ASSESSMENT_INPUTS.md`** (workflow + rolling pass under **`docs/assessments/`**), `.cursor/rules/Assessment-Read-First.mdc`, and attach **`.cursor/rules/Assessment-Scope-V1_1.mdc`** (**`@Assessment-Scope-V1_1`**) for scoring rules (not always injected).
- **Session / token hygiene (always-loaded rule):** `.cursor/rules/Session-Hygiene.mdc` — use **`REPO_DIGEST`** for orientation, avoid repeating full-file reads already in-thread, batch with one preamble; suggest a **new chat** when context is enormous or you pivot subsystems.
- **Agent execution (always-loaded):** `.cursor/rules/Agent-Execution-Policy.mdc` — parallel shells and Task subagents allowed on capable workstations; parent owns integration.
- **Working-tree safety (always-loaded):** `.cursor/rules/Agent-Working-Tree-Safety.mdc` — check `scripts/agent/check-working-tree-path.ps1` before editing tracked files; Cursor hooks in `.cursor/hooks.json` block overwrites of session-baseline dirty paths.
- **Shell / process hygiene (always-loaded):** `.cursor/rules/shell-hygiene.mdc` (canonical: `block_until_ms` tiers, parallel shells when independent, git, cleanup), `.cursor/rules/shell-heartbeat.mdc` (`STILL EXECUTING... HH:mm:ss` every 8s on Medium/Slow commands), and `.cursor/rules/Agent-Shell-Discipline.mdc` (pointer). Prefer Read/Grep over shell; call `.\scripts\ci\agent-compile-check.ps1` directly (no nested `powershell -File`).
- **Task discipline (always-loaded):** `.cursor/rules/User-Task-Discipline.mdc` — surface uncertainty, avoid speculative code, keep edits surgical, state acceptance criteria and verify before calling work done.
- **Historical artifact snapshots:** **`docs/archive/`** (including **`docs/archive/assessments/`**) — for **today's** weighted workflow, follow **`ASSESSMENT_INPUTS.md`**; use archives only for historical comparison.

## Partial .NET solution load

Use **[solution filters](https://learn.microsoft.com/visualstudio/ide/filtered-solutions)** next to **`ArchLucid.sln`** (Visual Studio **Open a project or solution**, or CLI `dotnet build <filter>.slnf`):

| Filter | Purpose |
|--------|---------|
| **`ArchLucid.Core.slnf`** | Contracts + Core + Application + focused unit tests (**`ArchLucid.TestSupport`**) |
| **`ArchLucid.Backend.slnf`** | Product hosts + domain libraries + integration tests (**excludes** **`ArchLucid.Benchmarks`**, **`ArchLucid.Analyzers`**) |
| **`ArchLucid.UI.slnf`** | Minimal .NET slice for **`archlucid-ui`**: Contracts + **`ArchLucid.Api.Client`** (+ client tests); the SPA itself is **`archlucid-ui/`** |

**CI and release** still assume the **full** **`ArchLucid.sln`**. **`dotnet build *.slnf`** still compiles **ProjectReference** closures (for example **`ArchLucid.Application`** pulls most domain projects); filters mainly shape **IDE top-level load** and give agents a **narrow entry**, not a smaller compile graph unless project references shrink.

After adding or renaming **`*.csproj`** files under the repo root, update the **`projects`** arrays in these **`*.slnf`** files.

## Local verification vs CI push corset

The **master/main push corset** (`.github/workflows/ui-typecheck-on-push.yml`) is what blocks merges once branch protection is configured. **A successful Debug `dotnet build` is not evidence** the corset will pass: `Directory.Build.props` sets `TreatWarningsAsErrors=true`, and the push corset builds **Release** (several analyzers only fail in Release).

Before pushing .NET changes that touch API, Core, or Decisioning:

```bash
export DOTNET_FAST_CORE_TEST_FILTER='Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord&FullyQualifiedName!~OpenApiContractSnapshotTests&FullyQualifiedName!~OpenApiBuyerContractSnapshotTests'
bash scripts/ci/run_push_corset_dotnet.sh
```

For UI changes, verify from a **clean install**, not a long-lived `node_modules` tree:

```bash
cd archlucid-ui && npm ci && npm run typecheck
```

Stale `node_modules` can hide duplicate nested resolutions (for example two `@tanstack/query-core` copies) that clean `npm ci` on CI surfaces as `TS2322`. After `npm ci`, CI runs `python3 ../scripts/ci/assert_single_npm_dependency_version.py @tanstack/query-core --prefix .` to fail PRs that introduce multiple resolved versions.

Scoped compile check for agents: `.\scripts\ci\agent-compile-check.ps1` (see `.cursor/rules/shell-hygiene.mdc`).

## Cursor Cloud specific instructions

Cursor Cloud Agent VMs are **Linux**. **`pwsh` is not preinstalled**; `python3` and `dotnet` usually are. Repo scripts and Pester suites expect PowerShell 7 + Pester 5 (same band as CI `azure-extractor-pester` in `.github/workflows/ci.yml`).

**One-time per VM (user prefix, no root):**

```bash
export PATH="$HOME/.local/bin:$PATH"
mkdir -p "$HOME/.local/pwsh" "$HOME/.local/bin"
curl -fsSL "https://github.com/PowerShell/PowerShell/releases/download/v7.4.6/powershell-7.4.6-linux-x64.tar.gz" \
  | tar -xzf - -C "$HOME/.local/pwsh"
ln -sf "$HOME/.local/pwsh/pwsh" "$HOME/.local/bin/pwsh"
pwsh -NoProfile -Command "Install-Module Pester -Scope CurrentUser -Force -SkipPublisherCheck -MinimumVersion 5.0.0 -MaximumVersion 5.99.99"
```

Do not commit the extracted tree under `$HOME/.local/pwsh`.

**Run repo scripts from repo root:**

```bash
pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path 'path/to/file'
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugPickZone.Tests.ps1'"
python3 scripts/agent/al-bug-audit-proven-rows.py
python3 scripts/tests/test_al_bug_audit_proven_rows.py
```

**Scoped .NET:**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet build ArchLucid.Core.slnf
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~YourTests'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

For commands expected **>15s**, emit `STILL EXECUTING... HH:mm:ss` every 8s (see `.cursor/rules/shell-heartbeat.mdc`). The repo-root **`AGENTS.md`** stub injected into Cloud Agents must stay in sync with this section.

## Private-beta trunk smoke + Gate 1

| Milestone | Doc / command |
| --- | --- |
| Invite-wave JwtBearer Playwright on `master` push | **`docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md`** — triage `Operator UI: private-beta access-path (JwtBearer)` |
| Full regression matrix (Vitest, Playwright, ZAP, …) | `bash scripts/ci/dispatch_full_ci_matrix.sh master` (or **Actions → CI → Run workflow** on `master`) after push corset + private-beta are green |
| Gate 1 — observed staging first review | **`docs/runbooks/GATE_1_SHIP_GATE_EVIDENCE.md`** — `archlucid pilot ship-gate-evidence --run-id <guid>` |
| JwtBearer local / CI mint | **`docs/library/LIVE_E2E_JWT_SETUP.md`** |

Apply golden-cohort ruleset (owner): `.\scripts\ci\apply-golden-cohort-gate-ruleset.ps1` after green `ui-typecheck-on-push.yml`. Do **not** add private-beta to required checks until first green trunk run (`.github/BRANCH_PROTECTION.md`).

## Canonical extension map

Contributor decision tree and entry points: **`.cursor/rules/Architecture-Invariants.mdc`**, **`docs/library/V1_SCOPE.md`**, **`docs/library/API_CONTRACTS.md`**.

**Report Problem V1 contract (TB-782):** **`docs/library/REPORT_PROBLEM_V1_SCOPE.md`** — high-stakes surfaces registry (`archlucid-ui/src/lib/report-problem-surfaces.ts`) and shared copy (`report-problem-copy.ts`). Dialog/API wiring is **TB-784**–**TB-792**.
