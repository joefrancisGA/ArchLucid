# UU-49 — Infrastructure Ask reads the snapshot

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-50 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave E (**UU-49**). **Depends on:** Infrastructure Ask.

## Goal

Infrastructure Ask says that answers use the inventory snapshot on the page and do not query live Azure.

## Why

The question box can look like a live Azure query. The page already asks against collected inventory.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient.tsx`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-ask-api.ts` (confirm the request uses the snapshot already on the page; do not change the request)

## What to build

1. Branch `uu/49-ask-reads-snapshot` from current `master`.
2. Above the question box, show: "Answers use the inventory snapshot on this page. They do not query live Azure."
3. Show it before the reader submits a question.
4. Do not change the Ask request, the snapshot selection, or the answer text.

## Acceptance criteria

- The sentence is visible above the question box on first load.
- Submitting a question still uses the existing Ask call.
- The sentence does not claim an observed traffic fact.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to open Infrastructure Ask and read the sentence before typing. Wait for that look before any commit.
