# CA-24 — New draft bootstrap creates the parent identity

**Do not** leave `/architecture/architectures/new` as “only a draft.” CA-14 server ensure should exist.

## Goal

Working **New architecture**:

1. First server persist creates draft **and** identity (CA-14).
2. After create, navigate to the **identity desk** (CA-20) with the new draft as current child — or to the draft child URL under that identity. Do not navigate to `/architecture/architectures/{draftId}` as if the draft were the architecture.
3. `/new` segment stays a bootstrap, not a stored id (`ARCHITECTURE_NEW_DRAFT_SEGMENT`).

## Why

The new path is the first impression of the customer object. If it still mint a draft GUID into the architecture segment, CA-20–22 fail on day one.

## Context

- `ARCHITECTURES_NEW_PATH`
- `ArchitecturesNewPageHeaderActions.tsx`
- `use-architecture-draft-autosave-persist.ts`
- CA-20 helpers

## What to build

1. Post-create navigation uses `architectureIdentityPath` / child draft path.
2. Vitest: create response with distinct `architectureId` and `draftId` → desk href uses architecture id.
3. Guided may still land on the wizard (ADR 0067) — do not auto-switch.

## Acceptance criteria

- Working new flow never puts `draftId` in the identity segment after persist.
- Offline/local-only sentence may remain until create succeeds (AD-04 leftover) — then identity exists.

## Constraints

- TB-2005 on any name field shown before create.
- No sample architecture as the default name.
