# CA-41 — Career export: no silent 20-finding cap

**Skip if** DA-11 already shipped. **Do not fork LK-09** (trail gate) or **LK-14** (stamp denominator).

## Goal

Career-facing finding inventories cannot drop rows 21+ without a **blocking** honesty control.

1. `DEFAULT_MAX_FINDINGS = 20` in `adr-from-run-slices.ts` is not allowed for Working **career** ADR/MADR export. Either include **all** findings or refuse to look complete (banner + confirm **Export incomplete sample**).
2. Print view: showing N of M; print is still not the sealed record.
3. Board-pack / sponsor DOCX: same rule if they slice findings.

## Why

An ARB packet with twenty findings while the queue has sixty is a livelihood failure.

## Context

- `adr-from-run-slices.ts`, `adr-from-run-mappers.ts`
- `package-print-view.ts`
- DA-11 (do not paste)

## What to build

1. Completeness helper `{ included, total, isComplete }`.
2. Vitest: 25 findings, Working career path → not silently 20.
3. Keep excerpt/narrative length caps (not inventory).

## Acceptance criteria

- Working cannot download an ADR that looks complete while `included < total`.
- Eval sample path labeled sample.

## Constraints

- Do not unseal (ADR 0039).
- Do not drop checklist rows without counting them.
