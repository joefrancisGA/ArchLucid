# ESI-04 — In-app preview for pictures, text, and PDF

**Depends on ESI-02 and ESI-03.** Preview is the **default** for types we can show safely. Download remains available.

## Goal

Activating the **source name link** on a stored file:

| Kind | Default action |
|------|----------------|
| Images (`png`, `jpeg`, `jpg`, `gif`, `webp`) | In-app preview (dialog or panel) with the image; Download still in the chrome |
| Text / Markdown / JSON / YAML / `.txt` / `.md` | Preview pane (monospace, scroll, no HTML interpretation) |
| PDF | Inline preview when the browser can (`iframe` / `object` with inline GET); Download fallback |
| DOCX / ZIP / unknown / `image/svg+xml` / HTML | **Do not preview.** Download only; link may be omitted or labeled Download |

Escape / `dialog` / focus trap. Close returns focus to the triggering link. Do not execute SVG or HTML.

## Why

The owner asked to click a picture or text file. Forcing a download to see a PNG is the wrong default for review work. SVG/HTML inline is a stored-XSS risk.

## Context

- ESI-02 inline vs attachment
- `RunDetailEvidenceInventorySection` open handler from ESI-03
- Existing modal/dialog primitives in `archlucid-ui/src/components/ui/`
- Brand-asset SVG safety notes in infra-evidence prompts — **uploaded customer SVG is not a brand asset**; do not render it

## What to build

1. Content-type / extension allowlist for preview. Fail closed to download.
2. Preview fetches via the authenticated GET (cookie/BFF as review detail already does) — no `<img src="https://…blob…">`.
3. Dialog title = file name (sentence case chrome, preserve the file name).
4. Vitest: image row opens dialog; citation row does not; SVG has download only; text preview does not use `dangerouslySetInnerHTML`.
5. Optional: reuse the same preview on ESI-05 if that table already has stored-file ids; otherwise keep the helper shared.

## Acceptance criteria

- PNG opens in-app without a required save-to-disk step.
- SVG/HTML never render as a document.
- Keyboard: open, Tab inside, Escape close, focus restore.

## Constraints

- Do not add a third-party PDF.js unless an existing in-repo viewer already exists — prefer native inline + Download.
- Do not OCR or re-extract in the preview.
- Do not claim “malware scanning on open.”
