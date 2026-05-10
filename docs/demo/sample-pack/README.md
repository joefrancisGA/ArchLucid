# Demo sample pack (offline)

Non-proprietary JSON fragments for **slides, PLG onboarding copy, and CI examples**.

- **`manifest-snippet.json`** / **`manifest-snippet-head.json`** — paired files for `scripts/integrations/github_pr_manifest_delta.py` and `.github/workflows/example-github-manifest-delta.yml`.
- **`finding-example.json`** — finding-shaped object matching list/inspect field names used in operator UI.
- **`trace-event-skeleton.json`** — illustrates pipeline timeline rows (see live **`GET /v1/authority/runs/{runId}/pipeline-timeline`** for authoritative data).

## CLI export

From the repository root (after a local build):

```bash
dotnet run --project ArchLucid.Cli -- demo export --out ./archlucid-demo-pack
```

Copies this folder to the target directory (creates the directory if missing; overwrites same-named files).
