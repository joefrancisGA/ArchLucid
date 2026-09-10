> **Scope:** Copy-paste Composer/Cloud Agent prompts for Architecture vs Security UI shells. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/product-line-00-index.md`](../../.cursor/prompts/product-line-00-index.md) (**PL-01–PL-05**)
> **Contract:** [`../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md`](../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md) (Product line) · catalog `archlucid-ui/src/lib/product-line/product-line-catalog.ts`
> **Do not fork:** second API host; second Next.js app; long-lived git product branches; GTM **M-90 / M-44 / M-91 / M-92**; closed assurance **TB-135 / TB-136**; desktop review tab collapse

# Architecture vs Security product line — Composer prompts (PL-01–PL-05)

**Created:** 2026-09-07 · **Status:** ready to run · **Audience:** Cursor Composer implementing the product-line split leftovers.

One Next.js app and **one** `ArchLucid.Api`. Local loop: `.\scripts\start-local-api-and-ui.ps1` starts API **5128** + Architecture UI **3000** + Security UI **3001**. Product selection is `NEXT_PUBLIC_ARCHLUCID_PRODUCT` plus cookie `archlucid_product_line_v1`.

Paste **one** `.cursor/prompts/product-line-NN-*.md` file per Composer session. **Do not implement from this document’s tables.**

Related (do not mix into a PL session): Security **display name** SecureNow is **SN-01–SN-08** — [`SECURENOW_CONSUMER_BRAND_COMPOSER_PROMPTS.md`](SECURENOW_CONSUMER_BRAND_COMPOSER_PROMPTS.md). **SN-01** replaces PL-02’s `ArchLucid Security` wordmark with **SecureNow**.

## Diagnosis → prompt

| Class | Prompt | Residual |
|-------|--------|----------|
| Local loop is still one website | **PL-01** | Start script must spawn two UIs against one API |
| Security chrome still says Architecture | **PL-02** | Wordmark, title, Architecture home RSC on `/` |
| Destinations will move often | **PL-03** | Catalog + `/internal/product-line` overlay |
| Shuffle leaves deep-link leftovers | **PL-04** | Route gate / settings / palette honesty |
| Pressure to fork the backend | **PL-05** | Written hold — no `ArchLucid.Host.Security` |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **PL-01** Dual local start | **First** | Catalog already on the product-line branch |
| **PL-02** Security chrome | After 01 preferred | Copy constants in `product-line-copy.ts` |
| **PL-03** Catalog shuffle | Anytime the owner names hrefs | PL-01 so both windows exist |
| **PL-04** Route gate honesty | After a shuffle | PL-03 |
| **PL-05** One API hold | Not implementation | Paste only if a session starts splitting hosts |

## Intentional — do not “fix”

- Do **not** add a second composition root, split migrations, or change INV-006 unless the owner explicitly reopens that hold **in that session**.
- Do **not** use two long-lived git branches as Architecture vs Security.
- Do **not** call `npm run dev:security` from Windows `Start-Process powershell.exe` (Unix env prefixes). Set `$env:NEXT_PUBLIC_ARCHLUCID_PRODUCT` in the spawned window.
- Do **not** hide desktop review workspace tabs behind **More**.
- Do **not** add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or reopen **TB-135** / **TB-136**.
- Do **not** treat missing CPA SOC 2 or a published third-party pen test as a product-line engineering gap.
- Do **not** move recycle bin to `both` without an explicit owner ask (architecture project restore).

## Global constraints

See [`.cursor/prompts/product-line-00-index.md`](../../.cursor/prompts/product-line-00-index.md). Working-tree safety; one class per file; no `ConfigureAwait(false)` in tests; scoped tests only; stage only files the prompt names.
