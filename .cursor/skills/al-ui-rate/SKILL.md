---
name: al-ui-rate
description: >-
  Critique an ArchLucid UI screenshot as if you were the design lead for
  Microsoft Azure Portal: brutally honest enterprise UX, IA, hierarchy, trust,
  a11y, discoverability, and buyer confidence; produce a P0 backlog, ship the
  fixes, commit to master, and update the owner traffic workbook. Use when
  the user invokes /al-ui-rate, attaches a UI screenshot for rating, or asks
  for an Azure Portal–bar design critique of a screen.
disable-model-invocation: true
---

# /al-ui-rate — Azure Portal–bar screenshot critique and remediation

Follow the full workflow in `.cursor/commands/al-ui-rate.md`.

## Invoke

```text
/al-ui-rate
/al-ui-rate <ID>
/al-ui-rate <ID> "<optional context>"
/al-ui-rate <ID> --rate-only
```

**Requires a screenshot attachment.** If none is attached, ask for one and stop.

## Pipeline (one invocation, no approval gate)

| Phase | Model | Output |
|-------|-------|--------|
| 1 — Rate | **`claude-opus-5-thinking-high`** subagent (always, even if the parent is Opus) | Critique + P0 backlog + current/projected Evidence and UX scores |
| 2 — Implement | **`composer-2.5`** subagent | P0 fixes + scoped verification + per-item shipped/partial/skipped status |
| 3 — Ship | Parent | Quality gate, commit and push to **`master`**, `/fix-ci` until green |
| 4 — Score | Parent | UX + Evidence written to `.local/owner/ui_route_traffic_estimates.md`, capped by P0s actually shipped, plus a dated Note |

`--rate-only` stops after Phase 1.

## Critique brief (verbatim)

> Critique this as if you were the design lead for Microsoft Azure Portal. Be brutally honest. Focus on enterprise UX, information architecture, visual hierarchy, trustworthiness, accessibility, discoverability, and buyer confidence. Produce a P0 backlog.

## Output

1. Pixel-grounded critique across the seven lenses in the command file
2. A **P0** backlog (3–8 items when warranted; do not inflate) with per-item disposition
3. Commit SHA on `master` and CI status
4. Workbook score/note write, or an explicit reason it was skipped

No `TB-###` rows unless the user asks.

## Related

- `.cursor/commands/al-ui-rate.md` — canonical workflow
- `/al-ui-score`, `/al-ui-note` — manual owner workbook updates
- `/al-ui-lowest` — lowest buyer-facing UX scores
- `/lucid-ui-audit` — full persona screenshot suite (not single-shot critique)
