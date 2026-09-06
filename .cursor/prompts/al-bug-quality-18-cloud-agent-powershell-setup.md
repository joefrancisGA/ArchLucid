# ABQ-18 — Document Cursor Cloud setup (PowerShell + Pester + Core test commands)

**Docs only.** Do not change picker scoring, Core converters, or CI job graphs except if you find the existing Pester install stanza in `ci.yml` is the canonical version pin to **cite**.

## Goal

`AGENTS.md` (repo root, what Cloud Agents inject) and the canonical `docs/engineering/AGENTS.md` both contain a **`## Cursor Cloud specific instructions`** section that tells a Linux Cloud Agent how to get `pwsh` + Pester 5 and how to run the scoped commands this repo’s ABQ / `/al-bug` tooling actually uses. Windows-first `.cursor/rules/shell-hygiene.mdc` stays; Cloud instructions are additive.

## Why

The Cursor Cloud Agent image is Linux and **does not ship PowerShell**. Repo rules and ABQ prompts assume `.\scripts\…ps1` and `Invoke-Pester`. Without a documented install, every Cloud session rediscovers a broken `pwsh: command not found` and either skips Pester or invents a one-off install. A 2026-09-06 Cloud session installed PowerShell **7.4.6** into `$HOME/.local/pwsh` with a symlink at `$HOME/.local/bin/pwsh`, then `Install-Module Pester -RequiredVersion 5.5.0 -Scope CurrentUser`. CI (`.github/workflows/ci.yml` `azure-extractor-pester`) pins Pester **5.x** (`MinimumVersion 5.0.0` / `MaximumVersion 5.99.99`). `dotnet` **is** present on the Cloud image (SDK 10.x under `$HOME/.dotnet` or the image default). That split — pwsh missing, dotnet present — is the whole prompt.

## Context

- Repo-root `AGENTS.md` — currently a four-line pointer at `docs/engineering/AGENTS.md`. Cloud Agents read **this file**. Put the operational Cloud section here **and** in the canonical copy; they must not diverge.
- `docs/engineering/AGENTS.md` — canonical agent guide; add the same heading after **Local verification vs CI push corset** (or immediately after **Local git hooks**) so humans on Windows still see Cloud as a special case.
- `.github/workflows/ci.yml` job `azure-extractor-pester` — cite the Pester 5.x install; do not duplicate a second pin that can drift.
- Do **not** edit `.cursor/rules/shell-hygiene.mdc` to require bash. Cloud may use bash for the tarball install, then `pwsh` for repo scripts.

## What to build

1. Add `## Cursor Cloud specific instructions` to **both** AGENTS files. Content, in this order:

   - **Image:** Linux; `pwsh` is not preinstalled; `python3` and `dotnet` typically are. Do not `apt-get` Windows-only packages. Do not kill unrelated processes by name (`pkill -f` is forbidden).
   - **PowerShell 7.4.x install (user prefix, no root):** tarball from the official PowerShell GitHub releases into `$HOME/.local/pwsh`, symlink `$HOME/.local/bin/pwsh`, ensure `$HOME/.local/bin` is on `PATH`. Pin a **7.4.x** version (7.4.6 is known-good). Document that agents must not commit the extracted tree.
   - **Pester 5:** `pwsh -NoProfile -Command "Install-Module Pester -Scope CurrentUser -Force -SkipPublisherCheck -MinimumVersion 5.0.0 -MaximumVersion 5.99.99"` (match CI). Optional exact 5.5.0 is fine if it stays inside that band.
   - **Repo scripts:** invoke `pwsh -File scripts/…ps1` from repo root. Windows rules still say no nested `powershell -File` launcher on Windows; on Cloud, `pwsh -File` **is** the interpreter.
   - **.NET:** `dotnet build ArchLucid.Core.slnf` and scoped `dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter '…'`. Point at `.\scripts\ci\agent-compile-check.ps1` via `pwsh -File` for the one allowed scoped compile. No full-solution `dotnet test` unless the user asked.
   - **Al-bug Pester (already Pester 5):**

     ```bash
     pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugPickZone.Tests.ps1'"
     pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugRollingStats.Tests.ps1'"
     pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugEscalation.Tests.ps1'"
     ```

   - **Validity audit:** `python3 scripts/agent/al-bug-audit-proven-rows.py` and `python3 scripts/tests/test_al_bug_audit_proven_rows.py` (pytest may be missing; the test file is runnable with `if __name__`).
   - **Working-tree safety:** `pwsh -File scripts/agent/check-working-tree-path.ps1 -Path '…'` before editing tracked files.
   - **Heartbeats:** for commands expected >15s, emit `STILL EXECUTING... HH:mm:ss` every 8s (see `.cursor/rules/shell-heartbeat.mdc`). `block_until_ms` tiers still apply.

2. Keep the repo-root file short: Cloud section + the existing pointer to `docs/engineering/AGENTS.md` / `archlucid-ui/AGENTS.md`. Do not paste the whole monorepo map into the stub.

3. One sentence in `docs/engineering/AGENTS.md` that repo-root `AGENTS.md` Cloud section must stay in sync (Cloud injects the stub).

## Acceptance criteria

- Heading `## Cursor Cloud specific instructions` exists in both AGENTS files.
- A Cloud Agent can install pwsh + Pester 5 from the written commands without inventing a mirror.
- Pester version band matches CI 5.x.
- No implication that the Cloud image is Windows PowerShell 5.1.
- No SOC 2 / pen-test / GTM cohort work.

## Constraints

- Docs only. Do not add `pwsh` to a Docker image or Terraform in this prompt (IaC for the Cloud **image** is out of scope unless the owner already has an environment.json change in flight — do not start one here).
- Do not run `/al-bug`.
- Working-tree safety on the two AGENTS files.
