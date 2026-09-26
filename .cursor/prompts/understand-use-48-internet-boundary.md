# UU-48 — Internet is the public boundary

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-49 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave E (**UU-48**). **Depends on:** hop labels. If UU-22 has landed, keep the short resource name.

## Goal

The first hop that says Internet also says that Internet is the public boundary, not an Azure resource.

## Why

Internet is a real hop label. Without a sentence, it looks like a missing resource name.

## Read first

- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (`PathHopsTable`)
- `archlucid-ui/src/lib/security-evidence-path-types.ts` (`securityEvidencePathHopNodeName`, if present)

## What to build

1. Branch `uu/48-internet-boundary` from current `master`.
2. On the first hop whose displayed From or To name is "Internet", add one helper: "Internet is the public boundary, not an Azure resource."
3. Show that helper once per hop table, not on later Internet hops.
4. Leave the visible name "Internet". Do not look up an Azure resource for it.

## Acceptance criteria

- A table whose first hop is Internet shows the helper once.
- A later Internet hop does not repeat it.
- A table with no Internet hop does not show it.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The helper is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

## Done when

Tests pass. Tell the owner to inspect a path that starts at Internet and read the helper. Wait for that look before any commit.
