# 8. Azure deployment topology

Terraform under `infra/` is the IaC source of truth. Workloads typically run as Container Apps (Api + Worker) against Azure SQL with per-tenant catalogs, Key Vault / managed identity, optional Front Door/APIM, Service Bus, Blob, OpenAI, Redis, and Cosmos.

## Diagram

![Azure topology](../architecture_diagrams/archlucid-azure-topology.svg)

SQL schema is applied by the application host (DbUp), not inline Terraform scripts. Map of roots: `docs/library/DEPLOYMENT_TERRAFORM.md`.
