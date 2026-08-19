# 32. Storage provider modes

`InMemory` never queues authority (dev/tests). `Sql` is the production path and must use `SystemWithPerTenantCatalogs` on hosted workloads; `SingleCatalog` is CI/local only and fail-closed in prod-like hosts. Cosmos graph remains an optional outbox side path.

![Storage provider modes](../architecture_diagrams/archlucid-storage-provider-modes.svg)
