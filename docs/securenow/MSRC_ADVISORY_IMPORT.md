# Reviewed MSRC batch import and legacy alias replay

Use the [source preview](MSRC_ADVISORY_PREVIEW.md) to obtain the exact CVE, CSAF product ID,
source URL, and byte-level SHA-256 before reviewing a deployment mapping and remediation obligation.
Put the reviewed inputs in a JSON manifest:

```json
{
  "scope": {
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "workspaceId": "00000000-0000-0000-0000-000000000002",
    "projectId": "00000000-0000-0000-0000-000000000003"
  },
  "advisories": [
    {
      "url": "https://msrc.microsoft.com/csaf/vex/2026/msrc_cve-2026-12345.json",
      "cve": "CVE-2026-12345",
      "productId": "example-product",
      "sha256": "<reviewed document SHA-256 in hex>",
      "targetKey": "container-apps/runtime",
      "cloudResourceId": "00000000-0000-0000-0000-000000000004",
      "remediation": { "owner": "Customer", "providerFix": "Unknown", "customerAction": "Required" }
    }
  ],
  "legacyAliases": [
    {
      "legacyFindingId": "00000000-0000-0000-0000-000000000005",
      "payloadHashSha256": "<finding payloadHashSha256 in base64 from a reviewed scoped detail response>",
      "cve": "CVE-2026-12345",
      "targetKey": "container-apps/runtime",
      "cloudResourceId": "00000000-0000-0000-0000-000000000004"
    }
  ]
}
```

- Preview: `python -m scripts.securenow.msrc_advisory_import manifest.json`.
  This fetches only from MSRC and does not call the ArchLucid API.
- Apply an approved batch: set `ARCHLUCID_API_TOKEN` in your environment, then run
  `python -m scripts.securenow.msrc_advisory_import manifest.json --apply --api-origin https://your-api.example`.
  Use an identity with read and execute access to exactly the intended scope. A scheduler can
  run this command with approved inputs, but this change does not enroll a scheduler.
- If a document changes, refresh the preview and review the new hash. A vendor-reported
  product status is not used to infer deployment exposure or remediation responsibility.
  Source data is fetched directly over HTTPS. Detached signature verification is not implemented.
- Imports go through the existing scoped canonical-ingest endpoint. Legacy rows are read
  back and rechecked against their reviewed IDs, hash, scope and exact typed CVE. The command
  attaches them as reference-only provenance, and only an existing canonical finding can
  accept them. It never deletes, changes the status of, or hides the original rows.
- Batch ingest is per-item, not atomic. Inspect failure counts, correct rejected items, and
  replay. If authoritative items fail, legacy replay is not attempted. Do not assume an
  interrupted HTTP response means no writes occurred.
