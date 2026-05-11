# Repository guidance for coding agents

## Monorepo layout

| Area | Path | Scoped agent doc |
|------|------|------------------|
| Backend / .NET hosts | Root `ArchLucid.*` projects, `ArchLucid.sln` | This file + `.cursor/rules/Navigation.mdc` |
| Web app | **`archlucid-ui/`** | **`archlucid-ui/AGENTS.md`** |
| Docs spine | **`docs/`** | `docs/START_HERE.md`, `docs/engineering/` for builders |

Full build and CI alignment: **`docs/engineering/BUILD.md`**.

## Reduce context before deep reads

- **Assessments / readiness passes:** **`docs/library/REPO_DIGEST.md`** (skim; regenerate with **`python scripts/repo_digest/build_repo_digest.py`**), **`docs/library/ASSESSMENT_INPUTS.md`**, **`docs/assessments/LATEST.md`**, `.cursor/rules/Assessment-Read-First.mdc`, and attach **`.cursor/rules/Assessment-Scope-V1_1.mdc`** (**`@Assessment-Scope-V1_1`**) for scoring rules (not always injected).
- **Session / token hygiene (always-loaded rule):** `.cursor/rules/Session-Hygiene.mdc` — use **`REPO_DIGEST`** for orientation, avoid repeating full-file reads already in-thread, batch with one preamble; suggest a **new chat** when context is enormous or you pivot subsystems.
- **Historical artifact snapshots:** `docs/archive/assessments/` (default exclusions in `.cursorignore`).

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
