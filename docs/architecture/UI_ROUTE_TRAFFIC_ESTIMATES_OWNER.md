> **Scope:** Owner-maintained UI route traffic and Evidence scoring workbook location.

# UI route traffic estimates (owner workbook)

The **live scoring workbook is not in git**. It lives at:

```text
.local/owner/ui_route_traffic_estimates.md
```

Use `/al-ui-score`, `/al-ui-note`, and `/al-ui-tableupdate` — those commands read and write that path automatically.

## Why this moved

`docs/architecture/ui_route_traffic_estimates.md` was repeatedly overwritten on branch
switches because older branches still tracked a copy in git. Git cannot protect a tracked
file from checkout, even when it is listed in `.gitignore`.

The owner workbook is now:

- **Outside any tracked path** (`.local/` is fully gitignored)
- **Removed from git index** on `master` (legacy path deleted from the repo)
- **Blocked from commits** (pre-commit rejects staging `.local/` or the legacy path)
- **Removed after checkout** when an older branch restores the tracked legacy file

## First-time setup

After cloning or if the owner file is missing:

```powershell
python .\scripts\ci\bootstrap-ui-route-traffic-owner-workbook.py
```

This copies, in order:

1. An existing legacy `docs/architecture/ui_route_traffic_estimates.md` on disk (if present), or
2. The tracked template `docs/architecture/ui_route_traffic_estimates.template.md`

into `.local/owner/ui_route_traffic_estimates.md` without overwriting an existing owner copy.

Install git hooks once so branch switches cannot resurrect the legacy tracked path:

```powershell
pwsh scripts/install-git-hooks.ps1
```

## Related docs

- [`ui_routes.md`](ui_routes.md) — route catalog and demo tiers
- [`ui_route_traffic_estimates.template.md`](ui_route_traffic_estimates.template.md) — tracked bootstrap template (scores default to 0)
- `scripts/ci/sync-archlucid-ui-route-traffic-workbook.py` — reconcile owner workbook or template with canonical catalog
- `scripts/ci/assert_ui_route_traffic_workbook_canonical.py` — CI drift guard (template must match catalog)
