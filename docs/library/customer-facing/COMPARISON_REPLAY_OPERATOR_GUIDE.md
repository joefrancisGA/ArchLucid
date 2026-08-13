> **Scope:** Customer-facing — comparing architecture packages and replaying a stored comparison from the architect workspace. API payload details live in engineering documentation.

# Compare and replay

Use **Compare** when you need to see what changed between two architecture packages. Use **Replay** (**Validate review** in the workspace) when you want to regenerate or re-export a comparison you already saved — without re-running a full architecture review.

## When to compare

Compare two reviews when:

- Evidence or design intent changed and you want a delta for sponsors or reviewers.
- You are preparing a second review and need to show progress against a finalized baseline.
- Governance asked what differs after a policy pack or scope change.

Open **Compare two reviews** from the analysis tools in the architect workspace, pick two reviews in the same workspace, and generate the comparison summary.

## When to replay

**Replay** (**Validate review** in the workspace) uses a **saved comparison record** — the product's stored result of an earlier compare. Replay can:

- Regenerate the comparison summary from that stored result.
- Export the comparison again (for example Markdown or HTML).
- Optionally save the replay as a new comparison record.
- Optionally verify that a regenerated comparison still matches what was stored (drift check).

Replay does **not** replace starting a new architecture review when your evidence has materially changed. Prefer a new review (or compare two fresh packages) when the architecture itself moved.

## When to use this guide

Use this page for **compare and replay mechanics** — side-by-side deltas between two packages or regenerating a saved comparison record.

For the **repeat architecture review loop** (compare → replay → governance dry-run → second finalize → sponsor proof), use the repeat-review help guide instead — see **Which second-review help guide?** above.

## What you get

| Output | Use when |
| --- | --- |
| Comparison summary | Quick narrative of what changed between packages |
| Export formats | Shareable delta for sponsors, security, or audit |
| Drift / verify result | Confirm a stored comparison still matches regenerated logic |

## Related guides

- [Compare two reviews](/insights/compare-two-reviews) — open the live pair-diff workspace.
- [Validate review](/internal/replay) — re-check or replay a saved comparison record.
