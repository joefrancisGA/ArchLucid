---
name: "source-command-sn-ui-rate-lowest"
description: "Rate SecureNow routes with the lowest scored UX in the owner workbook"
---

# source-command-sn-ui-rate-lowest

Use this skill when the user asks to run the migrated source command `sn-ui-rate-lowest`.

## Command Template

# SecureNow lowest UX routes (`/sn-ui-rate-lowest`)

SecureNow-scoped companion to `/al-ui-rate-lowest`. It filters the owner workbook to
the live SecureNow operator and help route set, then selects the lowest **scored**
UX routes.

```text
/sn-ui-rate-lowest
/sn-ui-rate-lowest 5
/sn-ui-rate-lowest 1 --rate-only
```

- `N` defaults to `1` and must be positive.
- `--rate-only` runs Phase 1 critique/workbook scoring only.
- Routes with workbook UX `0` are excluded because they are unscored.
- SecureNow uses the **Working** critique stance by default, matching the SecureNow
  Phase 1 rating pass.

## Workflow

1. List the candidates:

```bash
python scripts/ci/list-securenow-ui-rate-lowest.py --limit <N>
```

2. Process routes sequentially with the `/al-ui-rate` four-phase pipeline:
   - Phase 1: Opus High critique against the Working instrument brief.
   - Phase 2: Composer 2.5 implements the complete P0/P1/P2 backlog unless
     `--rate-only` is present.
   - Phase 3: commit/push the route revision and clear CI before the next route.
   - Phase 4: write the capped UX/Evidence score and note to the workbook.

3. Resolve screenshots from the SecureNow capture set first:
   `archlucid-ui/public/screenshots/securenow-ui-rate/{slug}.png`.
   If unavailable, capture the route in the SecureNow operator shell and verify
   the landed pathname before rating.

## Important distinction

This command ranks by the owner workbook UX score, not the `/opt/cursor/artifacts`
Opus Phase 1 scores. Newly added workbook rows default to UX `0` and therefore
must receive an owner score before this command selects them.
