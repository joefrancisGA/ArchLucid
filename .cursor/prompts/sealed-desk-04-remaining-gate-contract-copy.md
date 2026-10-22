# SD-04 — Remaining CLI / help / stream copy matches the gate

**Do not fork LS-03** (SPA product strings). **Do not fork IS-06** (stamp / print / PDF formatters). **Do not fork SD-01** (library density contracts). This file is the **remaining operator-facing non-SPA sentences**: CLI help, in-app help topics that quote the gate, and stream-of-record notes that still say typed engines are protected from the score.

## Goal

`archlucid` CLI finding/list/export help, operator help topics that mention insight density, and `FINDING_STREAM_PRODUCT_OF_RECORD.md` leftovers after SD-01 all say: rows stay on the package; classification is Decision-grade vs checklist per the gate. They must not say “advisory for typed engines” or “ID-11 still forbids demotion.”

## Why

Professionals live in CLI and help as much as the stamp. LS-03 can clean the SPA while `archlucid findings` and `/help` still teach the old control. That split is how a career briefing gets two answers.

## Context

- Grep `ArchLucid.Cli` / `archlucid-ui/src/lib/help` / `archlucid-ui/src/app/(operator)/help` for `typed-engine-protected`, `insight-density`, `advisory`, `Decision-grade`
- `docs/library/FINDING_STREAM_PRODUCT_OF_RECORD.md` if SD-01 left a stream-specific sentence
- `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md` — in-app help, not GitHub blob
- LS-03 inventory pattern (`production-desk-chrome-eval-inventory.ts`) — **extend or sibling** for CLI/help paths, do not duplicate the SPA file list

## What to build

1. Inventory CLI `--help` strings, help topic bodies, and stream doc sentences that still describe the pre-0070 gate.
2. Replace with classification-honest lines. Keep “rows remain on the package.”
3. Guard: listed files must not contain `always promote` / `typed-engine-protected` as a Promote reason (origin telemetry `typed-engine-scored` is allowed in diagnostics/help appendix).
4. Focused CLI or help Vitest if those projects already snapshot help text; otherwise a small inventory test next to LS-03’s guard.

## Acceptance criteria

- `archlucid` help that mentions density names checklist vs Decision-grade, not “protected from the score.”
- Working `/help` density topics match the miss clause lead.
- No GitHub blob URLs added. No 40th engine.

## Constraints

- Do not edit the gate.
- Do not restyle stamp/PDF (IS-06 / LS-12).
- Do not auto-open help (LD-15).
