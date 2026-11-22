---
name: al-merge
description: >-
  Run /al-merge: batch-merge all open GitHub pull requests via scripts/agent/al-merge-open-prs.ps1
  (default admin bypass for BLOCKED-but-mergeable aspect queues). Report merged count and any
  remaining open PRs.
---

# `/al-merge` — merge all open pull requests

When the user types **`/al-merge`** or asks to merge **all open PRs**, execute **`.cursor/commands/al-merge.md`** in full.

1. Parse optional flags: **`--dry-run`**, **`--require-checks`**, **`--squash`**.
2. From repo root, run **`.\scripts\agent\al-merge-open-prs.ps1`** with the matching parameters (`-DryRun`, `-RequireGreenChecks`, `-MergeMethod squash`).
3. Summarize merged PR numbers, failures, and remaining open count.

Do **not** commit code, amend branch protection, or merge a single named PR unless the user narrows scope away from "all open."
