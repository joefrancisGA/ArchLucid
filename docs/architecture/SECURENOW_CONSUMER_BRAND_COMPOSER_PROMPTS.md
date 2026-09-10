> **Scope:** Copy-paste Composer/Cloud Agent prompts to replace **consumer-facing** “ArchLucid” with **SecureNow** in the Security product shell. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/securenow-brand-00-index.md`](../../.cursor/prompts/securenow-brand-00-index.md) (**SN-01–SN-08**)
> **Depends on:** [`PRODUCT_LINE_COMPOSER_PROMPTS.md`](PRODUCT_LINE_COMPOSER_PROMPTS.md) (**PL-01–PL-05**) — one API, two UI processes (`NEXT_PUBLIC_ARCHLUCID_PRODUCT`)
> **Do not fork:** second API host; second Next.js app; C# namespaces; `ARCHLUCID_*` env vars; webhook/SAML protocol names; company legal entity; GTM **M-90 / M-44 / M-91 / M-92**; closed assurance **TB-135 / TB-136**; desktop review tab collapse

# SecureNow consumer brand — Composer prompts (SN-01–SN-08)

**Created:** 2026-09-07 · **Status:** ready to run · **Audience:** Cursor Composer implementing Security-shell display-name copy (not a platform rename).

**Product vs company (locked unless the owner reopens it in that session):**

| Layer | Security shell (`NEXT_PUBLIC_ARCHLUCID_PRODUCT=security`) | Architecture shell |
|-------|-----------------------------------------------------------|--------------------|
| Consumer product name | **SecureNow** | **ArchLucid** |
| Legal / company / Trust Center entity | **ArchLucid** until GTM/legal says otherwise | **ArchLucid** |
| Code, headers, config keys, CLI | Unchanged (`ArchLucid.*`, `X-ArchLucid-*`, `ARCHLUCID_*`) | Unchanged |

Paste **one** `.cursor/prompts/securenow-brand-NN-*.md` file per Composer session. **Do not implement from this document’s tables.**

## Diagnosis → prompt

| Class | Prompt | Residual |
|-------|--------|----------|
| No single display-name token; chrome still says ArchLucid | **SN-01** | Wordmark, tab title, 403/outage, “Powered by” |
| Cloud setup copy names ArchLucid as the connector | **SN-02** | Preflight, Azure/AWS/GCP wizards, secure-connect help |
| Shared admin/auth/integrations still say ArchLucid | **SN-03** | SSO/SAML, webhooks, account, support, branding preview |
| Help hub and markdown keep ArchLucid (and tests require it) | **SN-04** | Product-line-aware help rewrite; do not strip Architecture help |
| Emails, PDFs, ITSM bodies still default to ArchLucid | **SN-05** | `ProductDisplayName` + export footer; no protocol rename |
| Assurance pages mix product and company | **SN-06** | `/assurance-status`, operator security-trust; “SecureNow, from ArchLucid” |
| Rename will regress without a leak check | **SN-07** | Security-mode `\bArchLucid\b` allowlist ratchet |
| Temptation to rename the platform | **SN-08** | Written hold — identifiers, domains, Architecture product |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SN-01** Display name + chrome | **First** | Product-line catalog + dual-start (**PL-01**). Overrides **PL-02** wordmark copy (`ArchLucid Security` → **SecureNow**). |
| **SN-02** Cloud / federation copy | After 01 | Display-name helper from SN-01 |
| **SN-03** Admin / auth / integrations | After 01 | Same helper; can parallel **SN-02** |
| **SN-04** Help rewrite | After 01 | Must not run as a global `ArchLucid` → `SecureNow` replace |
| **SN-05** Emails / exports / work items | After 01 | C# `ProductDisplayName`; keep protocol names |
| **SN-06** Trust / assurance surfaces | After 01 | Product vs company rule; do not rewrite DPA legal names |
| **SN-07** Leak ratchet | After 02–04 preferred | Allowlist from SN-06/SN-08 |
| **SN-08** Identifier / company hold | Not implementation | Paste if a session starts renaming namespaces or `archlucid.net` |

## Intentional — do not “fix”

- Do **not** globally replace `ArchLucid` in the repo (namespaces, tests named “ArchLucid” as a sample system, `ArchLucidManaged`, `ArchLucidAuth:`).
- Do **not** change Architecture chrome or Architecture-only copy.
- Do **not** rename `X-ArchLucid-Webhook-Signature`, SAML entity-ID *values*, or Entra object IDs — only consumer **labels** (SN-02/SN-03).
- Do **not** change `security@archlucid.net` / `archlucid.com` in **SN-01–SN-07** (company contact). SN-08 hold.
- Do **not** treat missing CPA SOC 2 or a published third-party pen test as a branding gap.
- Do **not** hide desktop review workspace tabs behind **More**.
- Do **not** add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or reopen **TB-135** / **TB-136**.

## Global constraints

See [`.cursor/prompts/securenow-brand-00-index.md`](../../.cursor/prompts/securenow-brand-00-index.md). Working-tree safety; one class per file; no `ConfigureAwait(false)` in tests; scoped tests only; stage only files the prompt names.
