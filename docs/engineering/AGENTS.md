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

## Reduce context before deep reads

- **Assessments / readiness passes:** **`docs/library/REPO_DIGEST.md`** (skim; regenerate with **`python scripts/repo_digest/build_repo_digest.py`**), **`docs/library/ASSESSMENT_INPUTS.md`** (workflow + rolling pass under **`docs/assessments/`**), `.cursor/rules/Assessment-Read-First.mdc`, and attach **`.cursor/rules/Assessment-Scope-V1_1.mdc`** (**`@Assessment-Scope-V1_1`**) for scoring rules (not always injected).
- **Session / token hygiene (always-loaded rule):** `.cursor/rules/Session-Hygiene.mdc` — use **`REPO_DIGEST`** for orientation, avoid repeating full-file reads already in-thread, batch with one preamble; suggest a **new chat** when context is enormous or you pivot subsystems.
- **Agent execution (always-loaded):** `.cursor/rules/Agent-Execution-Policy.mdc` — do the work yourself (no implementation subagents), single-thread by default, hooks block parallel workers unless adjusted with explicit approval.
- **Shell / process hygiene (always-loaded):** `.cursor/rules/shell-hygiene.mdc` (canonical: `block_until_ms` tiers, one `Shell` per turn, git chaining, cleanup) and `.cursor/rules/Agent-Shell-Discipline.mdc` (pointer). Prefer Read/Grep over shell; call `.\scripts\ci\agent-compile-check.ps1` directly (no nested `powershell -File`).
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

## Canonical extension map

Contributor decision tree and entry points: **`.cursor/rules/Architecture-Invariants.mdc`**, **`docs/library/V1_SCOPE.md`**, **`docs/library/API_CONTRACTS.md`**.
