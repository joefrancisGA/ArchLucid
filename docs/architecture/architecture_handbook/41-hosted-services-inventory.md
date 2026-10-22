# 41. Worker hosted-services inventory

Leader-elected hosted loops drain authority, retrieval, integration, advisory/digest, archival, and optional Cosmos graph outboxes.

![Hosted services inventory](../architecture_diagrams/archlucid-hosted-services-inventory.svg)

## Capability ownership map (OP-06)

Each `IHostedService` registered for **Worker** or **Combined** roles is classified in [`product-capability-worker-map.json`](../data/product-capability-worker-map.json) (`platform`, `authority`, `infra-evidence`, `governance`). **One** `ArchLucid.Worker` process still runs the full composition root; do **not** deploy a second worker per product line until tech backlog **TB-2400**/**TB-2401** are explicitly picked up. Refresh the JSON with `scripts/ci/build_product_capability_worker_map.sh` when hosted-service registrations change.
