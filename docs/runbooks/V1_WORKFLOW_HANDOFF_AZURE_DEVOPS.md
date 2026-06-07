> **Scope:** Operator — Azure DevOps evidence handoff recipe for V1 committed runs.

# V1 workflow handoff — Azure DevOps

**Last reviewed:** 2026-06-07

## Minimum attach set

| Artifact | Purpose |
| --- | --- |
| `first-pilot-command-center.md` | Operator status + next action |
| `go-no-go-summary.md` | Sponsor-send disposition |
| `buyer-decision-brief.md` | One-page buyer decision summary |
| `first-value-report.md` | Committed-run narrative |
| `provenance-references.json` | Audit/artifact ids only |

## Steps

1. Run `archlucid sponsor-packet <runId> --out artifacts/sponsor-packet/<runId>`.
2. Review `limitations.md` and `buyer-decision-brief.md`.
3. Attach the minimum set to the Azure DevOps work item or pipeline run summary.
4. Use the sample comment in [`fixtures/v1-workflow-handoff-azdo-comment.sample.md`](fixtures/v1-workflow-handoff-azdo-comment.sample.md).

## Contract

- Do not attach secrets, raw prompts, or internal diagnostics.
- HOLD disposition blocks external circulation until resolved.
