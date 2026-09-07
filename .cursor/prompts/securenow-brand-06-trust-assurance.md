# SN-06 — Assurance and trust pages (product vs company)

**Do not** rewrite the DPA template’s legal party name. **Do not** change `security@archlucid.net` or `/.well-known/security.txt` contacts. **Do not** claim CPA SOC 2 or a published third-party pen test. **Do not** global-replace ArchLucid in `docs/go-to-market` or `docs/security`.

Depends on **SN-01**.

## Goal

Consumer **product** mentions on Security-reachable trust surfaces say **SecureNow**. The **company / contracting entity** stays **ArchLucid**. Mixed sentences use **“SecureNow, from ArchLucid.”**

## Why

`/assurance-status`, `/administration/security-trust`, and related evidence copy currently say “Review ArchLucid’s current assurance posture”, “hosted ArchLucid”, and vendor rows “ArchLucid internal security ownership”. After chrome says SecureNow, these pages would still sell the old product name — or, if naively replaced, would incorrectly rename the legal entity.

## Context

- `archlucid-ui/src/lib/security-trust-content.ts` — hero, vendor column, mailto
- `archlucid-ui/src/components/marketing/MarketingSecurityTrustView.tsx`
- `archlucid-ui/src/lib/operator/operator-security-trust-content.ts` — subprocessors “hosted ArchLucid”; NDA mailto subject `ArchLucid%20security%20review`
- `archlucid-ui/src/lib/security-trust-evidence-copy.ts`
- `archlucid-ui/src/lib/settings-security-trust-evidence-copy.ts`
- `archlucid-ui/src/lib/trust-center-evidence-copy.ts` / `MarketingTrustCenterBuyerBody` — **company** Trust Center; be conservative
- `archlucid-ui/src/components/TrustCenterFaqJsonLd.tsx`
- `archlucid-ui/src/app/(operator)/why-archlucid/**` — **Architecture proof page**. Do **not** rebrand to SecureNow. It is always-allowed in the catalog so Security users can open it; keep ArchLucid or add one line “Architecture product (ArchLucid)” if you touch it at all. Prefer **no edits**.

**Rewrite map (Security process):**

| Current | New |
|---------|-----|
| Review ArchLucid’s current assurance posture | Review SecureNow’s current assurance posture (product). Keep diligence contact as ArchLucid security. |
| ArchLucid internal security ownership | ArchLucid internal security ownership (**company team** — keep) **or** “SecureNow security ownership (ArchLucid)” if the row is about the product program |
| Third-party subprocessors register for hosted ArchLucid | hosted **ArchLucid** SaaS (company) that delivers **SecureNow** |
| mailto subject ArchLucid security review | `SecureNow%20security%20review` is OK; address stays `security@archlucid.net` |

Public marketing `/assurance-status` is shared. Use env product line for the Security **process** metadata/hero. Architecture process keeps ArchLucid hero. Do not cookie-switch legal pages in a way that makes Architecture users see SecureNow on `/privacy`.

## What to build

1. Display-name interpolation on **product** claims in the modules above.
2. Leave company/vendor/legal-entity strings as ArchLucid unless the sentence is clearly the Security product.
3. NDA mailto: keep inbox; subject may say SecureNow.
4. Vitest + buyer-polished tests for `MarketingSecurityTrustView` and operator security-trust page.

## Acceptance criteria

- Security process assurance hero names SecureNow as the product.
- `security@archlucid.net` still visible as the contact.
- Subprocessors/DPA still describe ArchLucid as the hosted-SaaS legal entity (with SecureNow as product where you added a clarifier).
- Architecture process `/assurance-status` still reads as ArchLucid product **or** shared company page — do not force SecureNow onto Architecture env.
- No SOC 2 CPA / third-party pen-test claim changes.

## Constraints

- Stage trust copy + tests only. No GTM markdown pack rewrite.
- Scoped Vitest. Sentence case. Honest claim discipline already on those pages stays.
