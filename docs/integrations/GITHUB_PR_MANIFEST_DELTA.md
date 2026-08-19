> **Scope:** GitHub Actions pattern for comparing **two exported golden manifest JSON** files inside a PR job (for example base branch artifact vs head artifact). Complements Azure DevOps PR decoration docs; this path is **GitHub-native** and uses only repository files.

# GitHub — PR manifest delta (offline diff)

## Inputs

- **`base-manifest.json`** — manifest export from the PR base (or prior review).
- **`head-manifest.json`** — manifest export from the PR head (or target review).

Exports should match the same shape your team already uses with **`archlucid manifest validate`** or UI “export manifest” — the diff script looks for common fields (`status` / `manifestStatus`, `decisionCount`, `warningCount`, `systemName`) and prints whatever is present.

## Local

```bash
python scripts/integrations/github_pr_manifest_delta.py --base base.json --head head.json
python scripts/integrations/github_pr_manifest_delta.py --base base.json --head head.json --markdown
```

## Composite action

The repository ships **`.github/actions/manifest-delta/action.yml`**. From a workflow that has checked out the repo:

```yaml
- name: Diff manifest exports
  uses: ./.github/actions/manifest-delta
  with:
    base-manifest: artifacts/base-manifest.json
    head-manifest: artifacts/head-manifest.json
```

Paths are relative to **`$GITHUB_WORKSPACE`**. Obtain the JSON files in prior steps (download artifacts, `curl` from an internal exporter, or commit deterministic fixtures in tests only).

## Security

- Do **not** echo full manifest JSON into logs if it contains customer-controlled text you are not allowed to retain in Actions logs.
- Prefer **OIDC** + short-lived tokens if you pull exports from a private API instead of artifacts.

## Related

- [`CONNECTOR_READINESS_MATRIX.md`](../library/CONNECTOR_READINESS_MATRIX.md) — matrix entry for GitHub vs Azure DevOps
- [`AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md`](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md)
