# SN-MENU-04 — SecureNow Home follows the menu

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-MENU-02. SN-MENU-03 may already be on the branch.

## Goal

SecureNow Home opens with a short posture strip, then one section per sidebar group, in sidebar order, using the sidebar labels.

## Why

Home sections today are Security, ARC-AMPE compliance, and Infrastructure. After SN-MENU-01 the sidebar is Findings, Environment, Remediation, Compliance, and Data sources. The security architect lands on Home first and should see posture before a list of tools. CISO staff should be able to read the strip without opening another page.

## Read first

- `archlucid-ui/src/app/(operator)/page.tsx` and the SecureNow home component it renders in the security product line
- `archlucid-ui/src/lib/product-line/securenow-security-home-copy.ts`, `securenow-compliance-home-copy.ts`, `securenow-infrastructure-home-copy.ts`, `securenow-home-destination-rows.ts`
- `archlucid-ui/src/lib/product-line/securenow-home-nav-order.test.ts`
- `archlucid-ui/src/lib/product-line/securenow-home-copy-hyperscaler-guard.test.ts`
- `archlucid-ui/src/lib/product-line/resolve-operator-home-page-metadata.ts`
- `archlucid-ui/src/lib/contextual-help/securenow-home-contextual-help-rows.ts`
- `archlucid-ui/src/components/ui/status-tag.tsx`, `severity-tag.tsx`
- `archlucid-ui/src/lib/design-tokens.ts` (`OPERATOR_TYPOGRAPHY`)

## What to build

### Posture strip

Three compact tiles, in this order, using `OPERATOR_TYPOGRAPHY.kpiValue` and `StatusTag`:

| Tile | Value | Source |
|------|-------|--------|
| Last collection | Relative time of the newest inventory snapshot for the active scope, for example `3 hours ago` | The existing snapshot list or drift endpoint the Changes & drift page already calls |
| Open findings | Count of open findings, with the Critical and High counts beside it | The existing findings endpoint `All findings` already calls |
| Frameworks | Count of enabled framework assignments for the active scope | The existing policy pack assignment endpoint `Frameworks` already calls |

Use only endpoints that already exist. If one does not return what the tile needs, leave that tile out and list it in the session summary. Do not add a new API in this session.

When there is no snapshot yet, the Last collection tile shows `No collection yet` with a `StatusTag` of `needs-attention` and a link to `Azure connections`. It does not link to Manual upload first.

Each tile links to its page: Changes & drift, All findings, Frameworks.

A failed tile load shows the API reason inside that tile only. It does not hide the other tiles or show a page-level error.

### Sections

After the strip, render sections in sidebar order: Findings, Environment, Remediation, Compliance, Data sources. Section headings and row labels come from the same constants as the sidebar (SN-MENU-01 group labels, SN-MENU-02 link labels). Row summaries come from the SN-MENU-03 tooltips when that prompt has landed. Otherwise keep the current summaries.

Retire the `ARC-AMPE compliance` home heading. ARC-AMPE is an edition concern (SN-ED-03).

Keep `securenow-home-nav-order.test.ts` true: Home rows appear in the same order as the matching sidebar links.

No pastel cards. Neutral surfaces, `space-y-4`, `p-4`.

## Tests

1. Home renders the three tiles in order when all three sources return data.
2. With no snapshots, the Last collection tile shows `No collection yet` and links to `/integrations/cloud-connections`.
3. A failed findings load shows its reason in the Open findings tile and the other two tiles still render.
4. Section headings equal the sidebar group labels, in sidebar order.
5. The home and nav order test passes. The hyperscaler copy guard passes.
6. The Architecture product line home is unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No new API, no new SQL, no new package.
- From `archlucid-ui`, run the Home and product-line Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

SecureNow Home shows last collection, open findings, and frameworks first, then the sidebar groups in sidebar order, with matching labels.
