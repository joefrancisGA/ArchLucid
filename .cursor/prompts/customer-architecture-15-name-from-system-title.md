# CA-15 — Display name from system name / title

**Do not** keep rewriting the identity name on every keystroke after the first save. CA-14 must exist.

## Goal

1. First persist: DisplayName = trimmed draft system name / title; fallback `Untitled architecture`.
2. Later draft title edits do **not** silently rename the identity (CA-10 / CA-31 own explicit rename).
3. If the identity is still the untitled fallback and the draft title becomes non-empty on a later save, **one-time** upgrade to that title is allowed — document it; do not flap.

## Why

If every title keystroke renames the portfolio row, two people editing two drafts of the same system fight. If the name stays Untitled forever, the Monday list is useless.

## Context

- Draft document system name / title fields
- CA-09 / CA-14
- CA-10 RenameAsync

## What to build

1. Name resolution helper (own file) + tests (empty → Untitled; later explicit title does not overwrite a custom identity name).
2. Wire into ensure-on-create only.

## Acceptance criteria

- Rename via CA-10 survives subsequent draft edits.
- Untitled upgrades once when a real title arrives, if you implement that branch — tested.

## Constraints

- Check nulls. No HTTP changes required.
- Do not merge two drafts by matching titles.
