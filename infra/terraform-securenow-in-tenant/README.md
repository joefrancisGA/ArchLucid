# SecureNow in-tenant Terraform root

This root deploys one SecureNow instance into a customer Azure tenant. It is
the in-tenant deployment described by ADR 0104 and is intentionally separate
from the hosted ArchLucid PaaS root.

The default is a no-op plan (`enable_deployment = false`). Set it to `true`
only when targeting a real Azure subscription and provide images, names,
administrator inputs, and an explicit collection read scope through a secret
manager or environment variables. Never commit populated `terraform.tfvars`.

## Architecture

- Azure Container Apps runs the API, UI, and worker in an internal load-balanced
  environment.
- SQL, Blob Storage, Key Vault, and optional Azure OpenAI use private
  endpoints. Public ingress and public data-plane access are disabled.
- API, worker, and Azure Automation collection each receive a dedicated
  user-assigned managed identity.
- `securenow-collection` is a private Blob container. The collection runbook
  writes snapshots there; the application reads them through managed identity.
- Azure Automation can run on a schedule or be started on demand by the API
  through ARM. The API receives the account and runbook names as configuration;
  it does not receive a key, SAS token, or shared secret.

The existing `terraform-storage`, `terraform-container-apps`, and
`azure-sql-serverless-app` modules are composed directly. Networking and Key
Vault are declared here because the existing private root expects an already
created SQL server, while the SQL module creates its own private endpoint.
Creating the VNet in this root avoids a dependency cycle without copying a
module.

## Usage

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with tenant-specific values.
terraform init -backend=false
terraform validate
terraform plan -var-file=terraform.tfvars
```

Do not run `terraform apply` from this repository without an approved change
window. The example has no secrets and intentionally leaves deployment
disabled.

## Security and operations

- Use Entra ID and managed identity for Azure access. The SQL administrator
  fields are break-glass inputs and should come from a protected secret
  variable, not source control.
- `collection_read_scope` must be an explicit resource or resource-group scope.
  Subscription-root Reader is rejected by a Terraform check.
- Keep `enable_collection_schedule = false` when the customer wants only
  on-demand collection. The API trigger remains wired to the Automation
  account and runbook.
- `azure_openai_account_id` refers to an existing customer account. This root
  creates its private endpoint and application RBAC, but the customer must
  independently confirm that the referenced account has public network access
  disabled.
- The generic edition is intended to remain Azure-first while leaving the
  application boundary open for future AWS and GCP collectors. The `uhg`
  edition uses product-owned names and must not contain `archlucid`.

Private endpoints add fixed networking and DNS resources; this costs more than
public endpoints but prevents internet data-plane exposure. Container Apps
keeps the initial topology operationally small. A later scale-out can add
additional workers, queue-backed collection, and customer-managed DNS without
changing the identity boundaries.
