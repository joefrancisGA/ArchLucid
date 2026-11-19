---
name: "source-command-al-merge"
description: "Batch-merge all open GitHub pull requests for the repo (default gh admin bypass)"
---

# source-command-al-merge

Use this skill when the user invokes **`/al-merge`** or asks to merge **all open PRs**.

## Command template

Follow **`.cursor/commands/al-merge.md`** end-to-end. That file is the authoritative procedure.

## Quick reference

| Input | Script |
|-------|--------|
| `/al-merge` | `.\scripts\agent\al-merge-open-prs.ps1` |
| `/al-merge --dry-run` | `...\al-merge-open-prs.ps1 -DryRun` |
| `/al-merge --require-checks` | `...\al-merge-open-prs.ps1 -RequireGreenChecks` |
| `/al-merge --squash` | `...\al-merge-open-prs.ps1 -MergeMethod squash` |

## Non-negotiables

- Repository root; **`gh`** must be authenticated.
- Default behavior uses **`--admin`** unless **`--require-checks`**.
- Never merge **CONFLICTING** PRs; report and stop (unless operator passed `-ContinueOnError` manually).
