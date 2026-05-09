## Summary

<!-- What changed and why (short). -->

## Required CI checks (branch protection)

Org admins: add **exact** GitHub check names (as shown on a green Actions run) under **Rules → Required status checks**.

Agent / offline eval gates (`.github/workflows/ci.yml` — dedicated jobs for discoverability):

| Display name (copy into required checks) |
| --- |
| `CI: prompt-injection regression (strict + block layer)` |
| `CI: agent offline regression (eval corpus + prompt JSON baseline)` |

See also `.github/BRANCH_PROTECTION.md`.

## Checklist

- [ ] OpenAPI / client surfaces updated if wire contract changed (see `docs/library/API_CONTRACTS.md` and workspace rules).
- [ ] Tests or linters run locally for touched areas.
