> **Scope:** Contributor-reference — Wire-format summary for **`POST /v1/architecture/request`** — integrators should treat **`GET /openapi/v1.json`** as authoritative for property names, required fields, and validation rules. This page orients readers to the C# contract type and starter JSON.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Architecture request wire format

## Binding type

The HTTP body is **`ArchLucid.Contracts.Requests.ArchitectureRequest`** ([`ArchitectureRequest.cs`](../../ArchLucid.Contracts/Requests/ArchitectureRequest.cs)). The API does not use a separate `CreateRunRequest` DTO for this route.

## Endpoint

- **`POST /v1/architecture/request`** — see OpenAPI **`GET /openapi/v1.json`** for response codes, auth, and schemas.

## Field overview (human-oriented)

| Area | Members |
|------|---------|
| Identity | **`requestId`** (required, client-stable id), **`systemName`**, **`environment`** (default `prod`) |
| Narrative | **`description`** (required, min length 10), **`inlineRequirements`** |
| Target | **`cloudProvider`** (defaults to Azure in the contract) |
| Lists | **`constraints`**, **`requiredCapabilities`**, **`assumptions`** |
| Baseline | **`priorManifestVersion`** — optional manifest version for incremental reviews (successive architecture reviews against a prior golden manifest) |
| Context | **`documents`** (`ContextDocumentRequest`), **`policyReferences`**, **`topologyHints`**, **`securityBaselineHints`**, **`infrastructureDeclarations`** |

Cardinality and string length limits are defined on the C# type via data annotations; the OpenAPI document reflects the same constraints for generated clients.

## Starter JSON on disk

Copy-paste examples aligned with this shape live under **[`templates/reference-architectures/`](../../templates/reference-architectures/README.md)** (patterns) and **[`templates/architecture-requests/README.md`](../../templates/architecture-requests/README.md)** (named scenarios).

## Related

- **`ArchLucid.Api/Contracts/README.md`** — short HTTP note for the same binding.
- **[`CONTEXT_INGESTION.md`](CONTEXT_INGESTION.md)** — how attached documents and ingestion limits behave.
- **[`API_CONTRACTS.md`](API_CONTRACTS.md)** — contract artifacts and PR checklist when schemas change.
