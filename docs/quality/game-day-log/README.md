> **Scope:** Optional human-written summaries for quarterly Simmy game days when repo commits are allowed; primary evidence remains GitHub Actions artifacts.

# Game day log directory

When the quarterly chaos workflow (`simmy-chaos-scheduled.yml`) is run with **`dry_run=false`**, capture:

- Workflow run URL
- `scenario_id` and `environment` inputs
- Pass/fail counts from uploaded TRX artifacts

If `.github` branch protection blocks automated commits, keep summaries in your incident/retro tool and link from `docs/runbooks/GAME_DAY_CHAOS_QUARTERLY.md` only.
