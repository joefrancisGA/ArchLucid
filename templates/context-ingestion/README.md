> **Scope:** Starter **`ArchitectureRequest`** JSON emphasizing **context ingestion** fields (`inlineRequirements`, `documents`, `policyReferences`, `topologyHints`, `securityBaselineHints`, `infrastructureDeclarations`) — same HTTP contract as [`templates/architecture-requests/`](../architecture-requests/README.md); not a separate API version.

# Context ingestion quick-start templates

Use these when pilots want **copy-paste blocks** for structured context beyond `description` alone. Merge fields into your own `systemName`, `requestId`, and scope headers (`x-tenant-id`, …) when calling **`POST /v1/architecture/request`**.

| File | Focus |
|------|--------|
| [baseline-requirements-and-policies.json](./baseline-requirements-and-policies.json) | **`inlineRequirements`** + **`policyReferences`** for checklist-driven reviews |
| [markdown-evidence-documents.json](./markdown-evidence-documents.json) | **`documents`** array with **`text/markdown`** bodies (ADR-style excerpts) |
| [simple-terraform-sketch.json](./simple-terraform-sketch.json) | **`infrastructureDeclarations`** (`simple-terraform`) plus topology/security hints |

## Usage

```bash
curl -sS -X POST "$BASE/v1/architecture/request" \
  -H "Content-Type: application/json" \
  --data-binary "@templates/context-ingestion/baseline-requirements-and-policies.json"
```

Field bounds and validation rules match **`docs/library/API_CONTRACTS.md`** § Create run — `ArchitectureRequest`.
