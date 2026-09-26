# UU-14 — Why this status is showing

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-15 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave B (**UU-14**). **Depends on:** `StatusTag`. If UU-13 has landed, keep its provenance meanings.

## Goal

Four status words open one sentence that says why that word is on the screen.

## Why

"Insufficient evidence", "Needs attention", "Blocked", and "Deferred scope" are already used as status labels. The label names the state. It does not say what the reader should understand.

## Read first

- `archlucid-ui/src/components/ui/status-tag.tsx`
- `archlucid-ui/src/lib/security-evidence-path-presentation.ts`
- A review surface that already renders a blocked or deferred-scope status. Search for "Deferred scope" and "Blocked" in `archlucid-ui/src`.
- `docs/go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md` (pass, hold, deferred — do not rewrite that doc)

## What to build

1. Branch `uu/14-status-why` from current `master`.
2. Add a small disclosure titled "Why am I seeing this?" beside these statuses only:
   - Insufficient evidence: "This result stays open because the cited evidence does not support a stronger band."
   - Needs attention: "This result needs a person to look before it can move forward."
   - Blocked: "This result cannot move forward until the listed blocker is resolved."
   - Deferred scope: "This item is recorded and is outside the current review scope."
3. Put the disclosure on the path-inspect confidence chip when the band is Insufficient evidence, and on one existing review or sponsor surface for each of the other three labels that already renders there. If a label is not rendered anywhere, skip it and say so.
4. Do not add the disclosure to every `StatusTag` in the app.
5. The disclosure is a button with `aria-expanded`, or a native `details` element. Do not navigate away.

## Acceptance criteria

- Insufficient evidence on a path shows the sentence after the disclosure opens.
- Confirmed, Highly likely, Probable, and Possible do not grow this disclosure in this session.
- The sentence does not add a percentage or a new status word.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. Do not tint the whole card.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

Add a test that opens the disclosure and reads the sentence. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open a path whose band is Insufficient evidence and read the sentence. Wait for that look before any commit.
