<!-- Product-line Composer prompts — paste one prompt per session.
     Origin: 2026-09-07 owner ask to show Infrastructure as its own product
     shell (Architecture vs Security) without forking the platform.
     Do not implement from this index. -->

# Architecture vs Security product line — Composer prompt set (PL-01–PL-05)

One Next.js app and **one** `ArchLucid.Api`. Product line is **UI composition**: `NEXT_PUBLIC_ARCHLUCID_PRODUCT=architecture|security` (default **architecture**), cookie `archlucid_product_line_v1`, and localStorage overlays. Canonical assignments: `archlucid-ui/src/lib/product-line/product-line-catalog.ts`. Nav contract: `archlucid-ui/docs/NAV_CONFIG_CONTRACT.md` (Product line section).

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/product-line-NN-*.md` file per Composer / Cloud Agent session.

**Status:** catalog + route gate + settings/palette filters shipped on `cursor/product-line-security-ui-187c`. **PL-01** (dual local start) is the remaining local-dev batch. **PL-02–PL-04** are polish. **PL-05** is an explicit hold.

Copy-paste docs index: [`docs/architecture/PRODUCT_LINE_COMPOSER_PROMPTS.md`](../../docs/architecture/PRODUCT_LINE_COMPOSER_PROMPTS.md).

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | One API, two websites locally | **PL-01** | `start-local-api-and-ui.ps1` spawns Architecture :3000 + Security :3001 against one API |
| 2 | Security still *looks* like Architecture | **PL-02** | Wordmark, document title, skip architecture home RSC on the Security process |
| 3 | Destinations will shuffle a lot | **PL-03** | Catalog + `/internal/product-line` playground honesty |
| 4 | Deep links / settings leftovers | **PL-04** | Route gate + hub leftovers after shuffle |
| 5 | Temptation to fork the host | **PL-05** | Written hold: no second host, migrations, INV-006, or git product branches |

## Run order

**PL-01** first (local loop). **PL-02** can follow on the same product-line branch. **PL-03** whenever destinations move. **PL-04** after a shuffle, not before. **PL-05** is not implementation — paste only if a session starts splitting the API.

| Prompt | Parallel? | Depends on | Do not fork |
|--------|-----------|------------|-------------|
| **PL-01** | First | Product-line catalog already on the branch | Docker demo stack; a second Next.js *app* |
| **PL-02** | After 01 preferred | `PRODUCT_LINE_WORDMARK_ARIA_LABEL` | New marketing site |
| **PL-03** | Anytime after catalog | `product-line-catalog.ts` | Duplicate nav configs |
| **PL-04** | After a shuffle | Route gate | Hiding `/help` / `/account` |
| **PL-05** | Hold | — | `ArchLucid.Host.Security`; second SQL catalog |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing tracked files.
- Commit only on a named feature branch (`cursor/<short-name>-187c` in Cloud Agent runs, or the branch the owner names). Do **not** use two long-lived git branches as the two products.
- **Do not** hide desktop review tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** add a second Next.js app, a second .NET composition root, a second migration set, or change INV-006 unless the owner **explicitly** reopens that hold in that session.
- **Do not** fork finding engines or coverage-shaped engines.
- **Do not** add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or reopen **TB-135** / **TB-136**.
- **Do not** rewrite TECH_BACKLOG **TB-156** history; the proxy gate stays, now for **each** UI.
- Windows UI spawn: set `$env:NEXT_PUBLIC_ARCHLUCID_PRODUCT` in the window, then `npx --no-install next dev --webpack -p <port>`. **Do not** call `npm run dev:security` from `Start-Process powershell.exe` (Unix `VAR=value` prefixes do not apply).
- Unlisted nav hrefs default to **architecture**. Use `both` for Infrastructure + shared admin/internal. Recycle bin stays **architecture** (exact match beats nested `/administration/workspace-settings`).
- Security shell **skips** the committed-review nav gate and role-density collapse so Infrastructure is not hidden behind a first sealed architecture review.
- Verification: focused Vitest for catalog/gate; `Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/start-local-api-and-ui.Tests.ps1'` for PL-01. Do not “fix” `NODE_ENV=test` emptying system-admin links as part of product-line.
- UI: Carbon density, sentence case, **TB-2005** form validation, **TB-645** vocabulary.
- Claim discipline: Security home must not imply architecture reviews, sealed manifests, or CPA SOC 2 / third-party pen-test publication.

## After each prompt

Summarize: files changed, tests run, residual risk, Architecture vs Security behavior, and whether the one-API hold still holds.
