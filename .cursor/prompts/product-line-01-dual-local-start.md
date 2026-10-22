# PL-01 — Dual local start (one API, two websites)

**Do not** add a second Next.js app or a second .NET host. **Do not** call `npm run dev:security` from Windows `Start-Process powershell.exe`. **Do not** change Docker demo ports (API 5000 / UI 3000). **Do not** rewrite TB-156 history.

If `Get-LocalUiSiteSpecs` already exists and `scripts/start-local-api-and-ui.ps1` already loops Architecture + Security, **verify Pester and stop** — do not re-implement.

## Goal

When an engineer runs `.\scripts\start-local-api-and-ui.ps1` from repo root, the machine starts:

1. **One** `ArchLucid.Api` (default **5128**).
2. **Architecture UI** on **3000** (`NEXT_PUBLIC_ARCHLUCID_PRODUCT=architecture`).
3. **Security UI** on **3001** (`NEXT_PUBLIC_ARCHLUCID_PRODUCT=security`).

Both Next.js processes proxy through the existing `archlucid-ui/.env.local` `ARCHLUCID_API_BASE_URL`. Wait until API live+ready, each UI `/`, and each UI `/api/proxy/health/live`. Open both browsers unless `-NoBrowser`. Security always opens `/` (do not reuse `-OpenPath` — architecture-only paths bounce in the Security shell).

## Why

Product line is two *shells*, not two platforms. The local loop must match that: one backend, two websites, so shuffling destinations in `product-line-catalog.ts` can be judged in two windows against the same data.

## Context

- `scripts/start-local-api-and-ui.ps1`
- `scripts/start-local-api-and-ui.helpers.ps1`
- `scripts/tests/start-local-api-and-ui.Tests.ps1`
- `archlucid-ui/package.json` `dev:security` (Unix-only; keep for non-Windows shells)
- `archlucid-ui/docs/NAV_CONFIG_CONTRACT.md` product-line section
- `docs/library/OPERATOR_DECISION_GUIDE.md` step 2

## What to build

1. `Get-LocalUiSiteSpecs` — Architecture + optional Security; throw when ports are equal **and** Security is included; include `RootUrl` and `ProxyHealthUrl`.
2. `Get-LocalUiWindowCommand -ProductLine -Port` — set `$env:NEXT_PUBLIC_ARCHLUCID_PRODUCT`, Internal nav + operator experience (existing local-engineer behavior), then `npx --no-install next dev --webpack -p {port}`.
3. Main script params: `-SecurityUiPort` (default 3001), `-SkipSecurityUi`.
4. Preflight, spawn, wait, and proxy-check **each** site. Skip spawn per product when that port already serves `/`.
5. `-NoBrowser` prints both URLs. Otherwise `Start-Process` Architecture (`-OpenPath`) then Security (`/`).
6. Pester: architecture command, security command, site list, skip-security, equal-port throw, equal-port allowed when Security omitted. Commands must **not** match `npm run dev` or a Unix `VAR=value next` prefix.
7. One-line docs in NAV_CONFIG + OPERATOR_DECISION_GUIDE. Do not expand TECH_BACKLOG TB-156.

## Acceptance criteria

- Default run is three processes: API + :3000 + :3001.
- `-SkipSecurityUi` restores a single Architecture UI.
- Windows spawn does not depend on bash env prefixes.
- Proxy gate still fail-closes (TB-156 intent) for **each** UI.

## Constraints

- Windows-only spawn via `powershell.exe` stays (same as today). Do not port the start script to bash in this prompt.
- Commit on the product-line feature branch the owner named (Cloud Agent: `cursor/product-line-security-ui-187c` unless told otherwise).
- Scoped Pester only. This Linux Cloud VM cannot run the start script itself (`Get-NetTCPConnection` / `powershell.exe`).
