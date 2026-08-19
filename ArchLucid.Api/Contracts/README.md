# HTTP contract notes

`POST /v1/architecture/request` binds **`ArchLucid.Contracts.Requests.ArchitectureRequest`** (not a separate `CreateRunRequest` type). That type includes optional context fields: documents, inline requirements, policy/topology/security hints, and **`InfrastructureDeclarations`** for structured IaC snippets.

See **`docs/CONTEXT_INGESTION.md`**, **`docs/library/ARCHITECTURE_REQUEST_WIRE_FORMAT.md`**, and **`docs/API_CONTRACTS.md`**.
