# Product demo pack

Contributor-facing **offline** materials live under **`docs/demo/sample-pack/`** (manifest fragments, a sample finding, timeline skeleton).

**Hosted SaaS buyers** do not use this path — it exists so GTM and engineering can share **sanitized** JSON shapes without copying from production tenants.

- **CLI:** `archlucid demo export [--out <dir>]` copies the sample pack next to your working tree (default `./archlucid-demo-pack`).
- **GitHub Actions:** See **[`docs/integrations/GITHUB_PR_MANIFEST_DELTA.md`](../integrations/GITHUB_PR_MANIFEST_DELTA.md)** for the composite action that diffs two manifest exports.
