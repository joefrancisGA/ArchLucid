# SN-IT-01 — Glossary row + inventory terminology helper

**Wave:** SecureNow Azure inventory terminology (**SN-IT**). **Do not** rename APIs, SQL, or Architecture review snapshot copy.

## Goal

Add a locked buyer glossary entry and a small TypeScript helper so SecureNow infrastructure copy uses **Azure inventory capture** / **inventory capture** consistently — not bare **snapshot** or **Snapshot A/B**.

## Read first

- `docs/architecture/SECURENOW_INVENTORY_TERMINOLOGY_COMPOSER_PROMPTS.md`
- `docs/library/INFRA_EVIDENCE_PLANE.md` §3
- `.cursor/prompts/securenow-inventory-terminology-00-index.md`

## What to build

1. Add a **Azure inventory capture** row to `docs/library/UI_GLOSSARY_V1.md` (or the canonical glossary file used by TB-645) defining: noun = materialized Azure inventory point-in-time; distinguish from **assessment snapshot** (audit export) and Architecture **sealed review** artifacts.
2. Create `archlucid-ui/src/lib/product-line/securenow-inventory-terminology-copy.ts` with exported constants for: capture (singular/plural), baseline capture, compare capture, drift nav title **Drift & Azure inventory**, and a one-line empty-state hint. No runtime string replace — constants only.
3. Vitest: `securenow-inventory-terminology-copy.test.ts` asserts locked strings and that constants do not contain standalone ` snapshot` or `Snapshot A` / `Snapshot B`.

## Do not

- Rename `snapshotId` or OpenAPI paths.
- Edit Architecture-only glossary rows unless the glossary file forces a shared definition (prefer Security-specific module).

## Done when

Glossary row exists, helper + tests land, and no implementation prompts beyond SN-IT-01 files are started in the same session.
