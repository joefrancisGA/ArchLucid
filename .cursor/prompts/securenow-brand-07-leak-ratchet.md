# SN-07 — Security-shell ArchLucid leak ratchet (CI)

**Do not** fail CI on `ArchLucid.*` project names, `ARCHLUCID_*` env, `X-ArchLucid-*` protocol constants, `com.archlucid.*` event types, or Architecture-only files. **Do not** implement remaining copy in this prompt — file allowlist gaps as comments pointing at SN-02–SN-06.

Depends on **SN-01** at minimum. Prefer after **SN-02–SN-04** so the first run is not a thousand failures.

## Goal

A deterministic check fails when **consumer-facing** Security-shell copy reintroduces whole-word `ArchLucid` outside an allowlist.

## Why

Without a ratchet, later features will paste “ArchLucid stores…” into new Security copy. Chrome-only renames regress silently.

## Context

- Pattern: existing UI drift guards (`archlucid-ui/scripts/*-drift-guard.test.ts`, `scripts/ci/check_*.py`)
- Consumer copy lives mainly in `archlucid-ui/src/lib/**/*copy*.ts`, `*-content.ts`, `*-topics.ts`, and selected `app/(operator)/**` + `components/**` strings
- Allowlist must include:
  - `*@archlucid.net` / `archlucid.com` / `archlucid.net`
  - Protocol: `X-ArchLucid-Webhook-Signature`, `ArchLucidAuth:`
  - Company phrases: `hosted ArchLucid`, `from ArchLucid`, `ArchLucid internal security`
  - Code identifiers in comments/types: `ArchLucidLogo`, `isArchLucidVendorStaffPrincipal`, `ArchLucidManaged` (provider enum — **do not** require renaming to SecureNowManaged)
  - `{ArchLucid tenant ID}` script tokens if SN-02 kept them
  - Test fixtures using “ArchLucid” as a **sample system name**
  - `why-archlucid` route strings (Architecture product page)
- Do **not** scan `docs/`, `.cursor/`, `ArchLucid.*.csproj`, or `node_modules`

## What to build

1. A focused check: Python under `scripts/ci/` **or** Vitest drift guard under `archlucid-ui/scripts/` — pick one, match existing style.
2. Scan list: start with files SN-01–SN-06 named; expand to `archlucid-ui/src/lib/**/*.ts` string literals if cheap.
3. Allowlist file `scripts/ci/data/securenow-archlucid-allowlist.json` (or sibling) with **reason** per pattern.
4. Wire into existing UI test job if there is a cheap hook (`npm run test:unit -- file`, or a `check:` npm script already used in CI). **Do not** add a new required GitHub check name unless the repo already has a catch-all `ui` script you can hang off. Prefer `archlucid-ui` Vitest so `ui-typecheck-on-push` / unit job picks it up.
5. Tests: a fixture string `ArchLucid stores connection metadata` in a fake copy file **must not** be committed; unit-test the scanner with temp strings instead.

## Acceptance criteria

- Scanner exits non-zero on a new disallowed `ArchLucid` consumer sentence in a scanned copy module.
- Allowlist documented; Architecture-only files not in scope.
- CI does not fail because `ArchLucid.Api` appears in an import.

## Constraints

- No full-repo `rg` gate that bans the company name.
- Stage scanner + allowlist + tests. If SN-02–SN-06 are not done, allowlist remaining known files with `TODO SN-0N` reasons — do not delete those strings here.
