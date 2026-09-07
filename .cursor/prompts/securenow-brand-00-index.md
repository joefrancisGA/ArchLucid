<!-- SecureNow consumer-brand Composer prompts — paste one prompt per session.
     Origin: 2026-09-07 owner ask: magnitude of replacing consumer-facing ArchLucid
     with SecureNow in the Security application, then implement via Composer batches.
     Do not implement from this index. -->

# SecureNow consumer brand — Composer prompt set (SN-01–SN-08)

Security product **display name** is **SecureNow**. Architecture product and the legal company stay **ArchLucid** unless the owner reopens that in the same session.

One Next.js app and **one** `ArchLucid.Api`. Product line is **UI composition**: `NEXT_PUBLIC_ARCHLUCID_PRODUCT=architecture|security`. Canonical catalog: `archlucid-ui/src/lib/product-line/product-line-catalog.ts`. Predecessor set: [`.cursor/prompts/product-line-00-index.md`](product-line-00-index.md) (**PL-01–PL-05**).

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/securenow-brand-NN-*.md` file per Composer / Cloud Agent session.

Copy-paste docs index: [`docs/architecture/SECURENOW_CONSUMER_BRAND_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_CONSUMER_BRAND_COMPOSER_PROMPTS.md).

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | Hardcoded product name in chrome | **SN-01** | Display-name helper; wordmark; tab title; 403; outage; “Powered by” |
| 2 | Cloud connector copy says ArchLucid | **SN-02** | Preflight topics; Azure/AWS/GCP wizards; secure-connect help |
| 3 | Shared admin/auth/integrations | **SN-03** | SSO/SAML labels; webhooks copy; account; support; branding preview |
| 4 | Help still requires the ArchLucid token | **SN-04** | Product-line-aware help rewrite + leakage tests |
| 5 | Emails / exports / ITSM bodies | **SN-05** | `ProductDisplayName`; export footer; work-item titles — not protocol names |
| 6 | Trust pages mix product and company | **SN-06** | Assurance + operator security-trust; keep legal entity ArchLucid |
| 7 | No CI leak check | **SN-07** | Security-mode `\bArchLucid\b` allowlist |
| 8 | Temptation to rename the platform | **SN-08** | Hold: namespaces, env, domains, Architecture product |

## Run order

**SN-01** first (helper + chrome). **SN-02** and **SN-03** in parallel after 01. **SN-04** after 01 (help is shared — do not global-replace). **SN-05** and **SN-06** after 01. **SN-07** after the copy batches it will scan. **SN-08** is not implementation.

| Prompt | Parallel? | Depends on | Do not fork |
|--------|-----------|------------|-------------|
| **SN-01** | First | PL-01 dual-start; overrides PL-02 “ArchLucid Security” wordmark | Second logo file; Architecture chrome |
| **SN-02** | After 01 | Display-name helper | Renaming Entra object IDs / IAM ARNs |
| **SN-03** | After 01; parallel with 02 | Same helper | `X-ArchLucid-Webhook-Signature` rename |
| **SN-04** | After 01 | Help markdown pipeline | Architecture help content |
| **SN-05** | After 01 | Email options already have `ProductDisplayName` | OpenAPI / header contracts |
| **SN-06** | After 01 | Product vs company rule | DPA/subprocessor legal names; `security@archlucid.net` |
| **SN-07** | After 02–04 | Allowlist from 06/08 | Scanning `ArchLucid.*` project names as failures |
| **SN-08** | Hold | — | `ArchLucid.Host.Security`; `archlucid.net` cutover |

## Product vs company (every prompt)

- **SecureNow** = Security *product* name consumers see in the Security shell.
- **ArchLucid** = Architecture product + legal/company (privacy, DPA, subprocessors register, `*@archlucid.net`) until GTM/legal reopens.
- Preferred compound on mixed surfaces: **“SecureNow, from ArchLucid.”** Do not invent “SecureNow Inc.”
- Code identifiers stay `ArchLucid`. Env stays `ARCHLUCID_*` / `NEXT_PUBLIC_ARCHLUCID_PRODUCT`.

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing tracked files.
- Commit only on a named feature branch (`cursor/<short-name>-66d0` in Cloud Agent runs, or the branch the owner names).
- **Do not** `sed`/`replace_all` the whole repo for `ArchLucid` → `SecureNow`.
- **Do not** hide desktop review tabs behind **More**.
- **Do not** add a second Next.js app or .NET host (PL-05).
- **Do not** add GTM **M-90 / M-44 / M-91 / M-92** or reopen **TB-135 / TB-136**.
- **Do not** imply CPA SOC 2 or a published third-party pen test.
- UI: Carbon density, sentence case, **TB-2005**, **TB-645**. One component per file. No `ConfigureAwait(false)` in tests.
- Verification: focused Vitest (and scoped `dotnet test` only on SN-05). Architecture `:3000` must still say **ArchLucid**.
- Stage only files the prompt names. Do not batch unrelated product-line catalog shuffles into a brand commit.

## After each prompt

Summarize: files changed, tests run, residual `ArchLucid` consumer strings in the Security shell, Architecture unchanged, and whether the identifier hold (SN-08) still holds.
