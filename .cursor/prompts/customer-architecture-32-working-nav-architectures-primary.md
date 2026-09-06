# CA-32 — Working nav: Architectures means identities

**Do not hide desktop review tabs.** **Do not auto-switch Guided users.**

## Goal

1. `OPERATOR_NAV_LINK_LABELS.architectures` on Working = **Architectures** (identities hub), not `ARCHITECTURE_DRAFTS_LIST_LABEL`.
2. Drafts, if still in nav, are a **secondary** item labeled **Drafts**.
3. Reviews stay reviews (children / all-reviews hub), not “Architecture packages” as the only portfolio (TB-738 history is acknowledged; Working portfolio is identities).
4. Palette destinations must match (CA-34). Do not list a Working dest the nav hides (SD-11 leftover).

## Why

i18n currently documents `architectures` as the draft inventory. The sidebar teaches the wrong object every hour of the day.

## Context

- `archlucid-ui/src/lib/i18n.ts`
- `useOperatorShellNavRows.ts`
- `NAV_CONFIG_CONTRACT.md`
- ADR 0069 one primary

## What to build

1. Nav labels + Working vs Guided split.
2. Drift/nav tests updated so they do not pin drafts-as-architectures on Working.
3. Do not add a competing Home CTA (IS-02).

## Acceptance criteria

- Working sidebar click **Architectures** lands on the identities hub (CA-25).
- Guided may keep draft inventory as the teaching list (CA-36).

## Constraints

- No More menu. No progressive hide of Architectures on Working.
- TB-645: do not call the identity a sealed record.
