# NEC-02 — Missing diagram file name is null, not a filename

**Do not implement from the index.** This file is the whole task.

## Goal

A pixel-diagram warning with no `file` token stores `fileName: null`. The operator sentence `Diagram file name was not stored.` is display copy only. A stored file whose name is that exact sentence still renders as a stored file.

## Why

`PIXEL_DIAGRAM_FILE_NAME_NOT_STORED` is both the missing-value marker and the label. `formatPixelDiagramNotVerifiableLabel` branches on `source.fileName === PIXEL_DIAGRAM_FILE_NAME_NOT_STORED`. `parsePixelDiagramNotVerifiableWarning` writes that sentence when `file` is absent (`read-pixel-diagram-not-verifiable-sources.ts`).

An uploaded file named `Diagram file name was not stored.` then takes the missing-name label (`Topology was not extracted.`) instead of `Diagram file stored; topology not extracted.`

Copilot threads `4407277820`, `4407277849`, and `4407277865` are the same defect.

## Context

- Branch: `cursor/al-polish-narrative-wizard-ask-honesty-4156` (PR #5463), or `master` after that PR merges
- `archlucid-ui/src/lib/architecture-spine/read-pixel-diagram-not-verifiable-sources.ts`
- Caller that trims `source.fileName` today: `readPixelDiagramSourceRows` in `archlucid-ui/src/lib/architecture-spine/read-architecture-desk-diagram-sources.ts`
- Tests: `read-pixel-diagram-not-verifiable-sources.test.ts`, `read-architecture-desk-diagram-sources.test.ts`
- Keep `PIXEL_DIAGRAM_FILE_NAME_NOT_STORED` and `PIXEL_DIAGRAM_TOPOLOGY_NOT_EXTRACTED_LINE` as the missing-name label. Keep `PIXEL_DIAGRAM_NOT_VERIFIABLE_OPERATOR_LINE` for a stored name.
- `pendingStoredFileMarker` is already `string | null`. Match that.

## What to build

1. Change `PixelDiagramNotVerifiableSource.fileName` to `string | null`.
2. Parse with `parseWarningToken(payload, "file")` and store that result. Do not substitute the display sentence.
3. In `formatPixelDiagramNotVerifiableLabel`, use the missing-name label when `fileName` is null or whitespace. Any other string, including the display sentence itself, uses `${fileName} — ${PIXEL_DIAGRAM_NOT_VERIFIABLE_OPERATOR_LINE} (not verifiable)`.
4. In `readPixelDiagramSourceRows`, do not call `.trim()` on null. A missing name becomes one desk row: `sourceKey` `pixel:file-name-not-stored`, `label` the display sentence, `status` `not-extracted`. Repeat warnings with no file still collapse to that one row. A real file whose name equals the display sentence uses `sourceKey` `pixel:` plus that name, so it does not collapse into the missing-name row.
5. Tests:
   - Warning with no `file` token parses to `fileName: null` and the label contains `Diagram file name was not stored.` and `Topology was not extracted.` It does not contain `Diagram file stored`.
   - `fileName` set to `Diagram file name was not stored.` uses the operator line and includes that filename.
   - Desk rows: one warning with no `file` token and one warning whose `file` token is that sentence produce two rows with different `sourceKey`s.

## Acceptance criteria

- No code path decides “name missing” by comparing a filename to an English sentence.
- Existing pixel-diagram fixtures that pass `file=topology.png` still show `topology.png` and the operator line.
- `source.fileName.trim()` is not called when `fileName` is null.

## Constraints

- Do not use a `symbol` sentinel. The parsed object is plain data passed into presentation helpers.
- Do not drop warnings that lack a `file` token. The polish change started rendering them; this prompt only stops using the label as the stored name.
- Do not change TB-645 operator wording.
