# SD-05 — Working mock CI is the operator identity

**Do not fork IS-08** (eval grandfather call-site inventory in production UI). **Do not delete** buyer-polished demo / golden-path suites. This file is **test identity**: default mock E2E (`playwright.mock.config.ts`) still boots `NEXT_PUBLIC_DEMO_MODE=true`, so the suite that engineers run and CI treats as “the operator app” is the evaluator skin.

## Goal

Architect-workspace mock coverage that claims to test the paying desk runs with **Working / full-operator** env (`playwright.operator-mock.config.ts` pattern: `NEXT_PUBLIC_DEMO_MODE=false`). Buyer-polished mock remains a **named** demo/eval suite (`buyer-golden-path`, marketing, showcase). Docs and npm script names stop calling the buyer-polish config “the operator mock.”

## Why

Casual products test the demo. Livelihood products test the desk people work in. The 2026-06 leakage audit’s root cause — polish gated on selling — is reintroduced every time mock CI inlines demo flags as the default. Working regressions (spawn lock, density bands, one primary) will not fail a buyer-polish build.

## Context

- `archlucid-ui/playwright.mock.config.ts` (`NEXT_PUBLIC_DEMO_MODE` default `"true"`)
- `archlucid-ui/playwright.operator-mock.config.ts` (already full-operator)
- `archlucid-ui/e2e/start-e2e-with-mock.ts`
- `archlucid-ui/package.json` `test:e2e:mock*` scripts
- `.github/workflows` jobs that run mock Playwright — do not expand the full `ci.yml` matrix without cause; prefer pointing the **operator-shell** mock job at operator-mock
- `archlucid-ui/docs/DEMO_FLAGS_AND_UNIT_TESTS.md` if it calls demo the operator default

## What to build

1. Inventory npm scripts + CI jobs that run mock E2E. Label each buyer-polish vs Working.
2. Any job whose specs live under architect-workspace / operator-shell (nav, review-detail, drafts, governance) uses operator-mock env. Keep `buyer-golden-path` and marketing on the demo config.
3. Rename or document scripts so `test:e2e:mock` is not implied to be the paying desk if it still sets demo true — either split (`test:e2e:mock:buyer` / `test:e2e:mock:operator`) or switch the default **operator** alias to operator-mock.
4. Update comments in `e2e/*.spec.ts` that say “mock E2E uses buyer-polished shell by default” where those specs moved.
5. Do not start a long-lived dev server. Do not run the full Playwright matrix in the agent session unless the prompt’s own spec change needs one named file.

## Acceptance criteria

- A contributor running the documented **operator** mock command does not get `NEXT_PUBLIC_DEMO_MODE=true`.
- Buyer golden-path specs still run on the demo config.
- Guided/demo product code is unchanged.

## Constraints

- Do not force Working chrome onto Guided fixtures.
- Do not collapse review tabs.
- Do not require a second Next build in every agent turn — document the existing operator-mock build note.
