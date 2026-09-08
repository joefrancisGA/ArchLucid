# SN-08 — Hold: do not rename the platform, domains, or Architecture product

**This prompt is a hold.** Implement **nothing** unless the owner’s message in **this same session** explicitly reopens a named item below (quote it in the summary).

## Goal

Keep **SecureNow** as the **Security product display name**. Keep **ArchLucid** as the Architecture product, legal company, code identity, and public domains until GTM/legal/security run a real cutover.

Do **not**:

- Rename C# namespaces, projects, or `ArchLucid.Host.*`
- Rename env `ARCHLUCID_*` / `NEXT_PUBLIC_ARCHLUCID_PRODUCT` (the *value* `security` stays; only labels change)
- Rename HTTP headers (`X-ArchLucid-Webhook-Signature`, `X-ArchLucid-TenantId`) without a dual-read compatibility period the owner scheduled
- Change `security@archlucid.net`, `support@archlucid.net`, `sales@archlucid.net`, `archlucid.com`, `archlucid.net`, or `security.txt` canonical URLs
- Rebrand Architecture chrome, `/why-archlucid`, review-board packets, or getting-started for the Architecture process
- Invent “SecureNow Inc.” or treat SecureNow as the DPA contracting party
- Add `ArchLucid.Host.Security` or a second Next.js app (that is **PL-05**)
- Start SOC 2 CPA or third-party pen-test programs (**TB-135** / **TB-136** stay Done on tech; GTM **G-REAL-05** / **G-ASSURANCE-02** are owner work)
- Hide desktop review tabs behind **More**

If asked to “just sed the repo” or “rename the company to SecureNow,” answer with this hold and point at **SN-01–SN-07** (display name + copy + ratchet).

## Why

A display-name change is bounded. A platform/legal/domain rename is a cutover: IdP reply URLs, email auth, certificates, Trust Center, procurement packs, and every integration contract. The Security UI can ship SecureNow without that cutover.

## Context

- [`.cursor/prompts/securenow-brand-00-index.md`](securenow-brand-00-index.md)
- [`.cursor/prompts/product-line-05-one-api-hold.md`](product-line-05-one-api-hold.md)
- `ArchLucid.Application/InfraEvidence/Branding/ProductBrandingDefaults.CompanyDisplayName`
- `archlucid-ui/public/.well-known/security.txt`

## What to build

Nothing. If the owner explicitly reopens domains or legal entity in this session, **stop and confirm**: DNS, IdP ACS, email From, DPA party name, and whether Architecture also rebrands — before writing code. Do not begin that work from this file alone.

## Acceptance criteria

- Session ends with no identifier/domain/legal-entity diff unless the owner’s explicit reopen is quoted in the summary.
- SN-01–SN-07 remain the implementation path for consumer copy.

## Constraints

- Do not add GTM **M-90 / M-44 / M-91 / M-92**.
- Do not “fix” SecureNow vs ServiceNow confusion in code; flag it in the summary only.
