# PL-05 — One API hold (do not split the host)

**This prompt is a hold.** Implement **nothing** unless the owner’s message in **this same session** explicitly says to reopen a second composition root (named, not implied).

## Goal

Keep Architecture and Security as **two UI shells on one platform**.

Do **not**:

- Add `ArchLucid.Host.Security` or a second `Program.cs` / composition root
- Split SQL migrations or catalogs by product line
- Change INV-006 tenancy/isolation topology for this split
- Create long-lived git branches `architecture` vs `security` as the shipping model
- Fork finding engines, collectors, or coverage-shaped engines
- Add a second Next.js app under the repo
- Start SOC 2 CPA or third-party pen-test programs (**TB-135** / **TB-136** stay Done on tech; GTM **G-REAL-05** / **G-ASSURANCE-02** are owner work)

If asked to “make Security its own backend,” answer with this hold and point at `product-line-catalog.ts` + PL-01 dual local start (one API, two websites).

## Why

A second host doubles auth, proxy, health, migrations, and isolation surface before the owner has even finished shuffling hrefs. The cheap experiment is two Next.js *processes* with different `NEXT_PUBLIC_ARCHLUCID_PRODUCT` values.

## Context

- `archlucid-ui/src/lib/product-line/*`
- `scripts/start-local-api-and-ui.ps1` (PL-01)
- `.cursor/rules/V1_1-assurance-backlog.mdc`
- `.cursor/rules/Tenant-Isolation-Defense-In-Depth.mdc` (read if anyone proposes catalog splits)

## What to build

Nothing. If the owner explicitly reopens a second host in this session, **stop and confirm** the named branch, the migration story (still one DDL file per database), and tenant isolation before writing code. Do not begin that work from this file alone.

## Acceptance criteria

- Session ends with no host/migration/INV-006 diff unless the owner’s explicit reopen is quoted in the summary.
- Dual-start remains one API.

## Constraints

- Do not collapse desktop review tabs as a consolation prize.
- Do not add GTM **M-90 / M-44 / M-91 / M-92**.
