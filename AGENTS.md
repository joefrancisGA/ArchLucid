<!-- **Scope:** Repo-root Cursor convention; canonical copy lives in docs/engineering/AGENTS.md. -->

# Repository guidance — coding agents

Full **monorepo map**, **`*.slnf`** filters, and assessment pointers: **`[docs/engineering/AGENTS.md](docs/engineering/AGENTS.md)`** · Next.js app only: **`[archlucid-ui/AGENTS.md](archlucid-ui/AGENTS.md)`**.

## Compile verification (agents)

**Debug `dotnet build` success is not evidence** that trunk will stay green. The **master/main push corset** (`.github/workflows/ui-typecheck-on-push.yml`) builds **Release** with `TreatWarningsAsErrors=true`. Prefer `scripts/ci/run_push_corset_dotnet.sh` or `scripts/ci/agent-compile-check.ps1` before claiming compile health.

After `npm ci` in `archlucid-ui`, CI asserts a single resolved `@tanstack/query-core` version (`scripts/ci/assert_single_npm_dependency_version.py`). Stale `node_modules` can hide duplicate nested copies that fail clean install on CI. Locally, `npm ls @tanstack/query-core` should show one version under the override (same check CI runs after `npm ci`).

## Cursor Cloud specific instructions

Cursor Cloud Agent VMs are **Linux**. **`python3` is preinstalled**. The base image does not include the .NET SDK or PowerShell. **`scripts/cloud-agent-install.sh`** (Cloud Agent `install`) installs the SDK pinned in **`global.json`**, Node.js 22 under **`/usr/local`**, PowerShell 7 + Pester 5, restores and Debug-builds **`ArchLucid.Api`**, and runs **`npm ci`** in **`archlucid-ui`**. **`scripts/cloud-agent-start.sh`** (Cloud Agent `start`) launches the API on port **5128** with **`ArchLucid__StorageProvider=InMemory`** (no SQL) and the Next.js dev server on port **3000**. Open the UI at **`http://localhost:3000`**. Next.js blocks dev assets when the browser host is **`127.0.0.1`**. Repo scripts and Pester suites expect PowerShell 7 + Pester 5 (same band as CI `azure-extractor-pester`). The manual steps below are what that install script runs when a tool is missing.

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

For commands expected **>15s**, emit `STILL EXECUTING... HH:mm:ss` every 8s (see `.cursor/rules/shell-heartbeat.mdc`). Keep this section in sync with **`docs/engineering/AGENTS.md`**.
