# SN-ED-02 — Branding per SecureNow edition

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-ED-01.

## Goal

The generic edition shows a quiet `Powered by ArchLucid` line in the workspace footer and on the help index. The UHG edition never renders `ArchLucid`, and CI proves it.

## Why

The owner prefers the generic edition to mention ArchLucid and requires the UHG edition never to. The SN-07 leak scanner is a static scan of copy modules. It cannot tell editions apart at runtime, and it treats any `ArchLucid` in SecureNow copy as a leak.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-archlucid-leak-scanner.ts` and its test
- `archlucid-ui/scripts/securenow-archlucid-leak-drift-guard.test.ts`
- `scripts/ci/data/securenow-archlucid-allowlist.json`
- `scripts/ci/check_securenow_archlucid_leak_guard_wiring.py` and its test
- `archlucid-ui/src/lib/product-line/product-line-display-name.ts`
- `archlucid-ui/src/components/shell/AppShellWorkspaceFooter.tsx` and its test
- `ArchLucid.Application/InfraEvidence/Branding/OperatorHelpProductTextPolicy.cs`
- `docs/architecture/SECURENOW_CONSUMER_BRAND_COMPOSER_PROMPTS.md` (SN-01 to SN-08 context; do not re-run them)
- The SN-ED-01 edition modules

## What to build

### Generic attribution

- Put the attribution copy in `archlucid-ui/src/lib/editions/generic/securenow-generic-attribution-copy.ts`. It holds `Powered by ArchLucid` and nothing else.
- Render it in `AppShellWorkspaceFooter` and on the in-app help index, in helper type, only when the product line is `security` and the edition is `generic`.
- Do not add the word to the sidebar, page titles, or tooltips.

### Scanner per edition

- Exclude `src/lib/editions/generic/` from the SN-07 scan through the allowlist `fileExclusions`, with the reason `Generic edition attribution; UHG runtime guard covers rendering`.
- Do not widen any other allowlist entry.

### UHG runtime guard

Add a Vitest suite that renders, with edition `uhg` and product line `security`: the operator shell, the sidebar, the SecureNow Home, the help index, and the workspace footer. Assert that the rendered text contains no `ArchLucid` (whole word, case-sensitive). Wire it into the same Vitest shard that runs the SN-07 drift guard, and extend `check_securenow_archlucid_leak_guard_wiring.py` to require the new file.

### Server text

If `OperatorHelpProductTextPolicy` or another server copy policy substitutes the product name, make it read `SecureNow:Edition` so UHG output never contains `ArchLucid`. Generic output may keep its current text. If emails or exports carry a footer with the company name, list them in the session summary rather than changing them here.

## Tests

1. Generic plus security: footer shows `Powered by ArchLucid`.
2. UHG plus security: footer, help index, Home, and sidebar contain no `ArchLucid`.
3. Architecture product line: footer is unchanged.
4. The SN-07 scanner still fails when `ArchLucid` is added to any copy module outside `src/lib/editions/generic/`.
5. The wiring check fails when the UHG runtime guard file is removed.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One class per file. No `ConfigureAwait(false)` in tests.
- If C# changed, compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'`
- From `archlucid-ui`, run the leak scanner, drift guard, footer, and new UHG guard tests, and `npx tsc --noEmit -p tsconfig.json`. From the repo root, run `python3 scripts/ci/tests/test_check_securenow_archlucid_leak_guard_wiring.py`.
- Do not commit.

## Done when

Generic SecureNow says `Powered by ArchLucid` in the footer and help index, UHG SecureNow renders no `ArchLucid` anywhere tested, and CI fails if either regresses.
