# Terraform: Azure Service Bus for ArchLucid integration events

Provisions a **namespace**, **topic** (duplicate detection enabled), and **two subscriptions** (`archlucid-worker`, `archlucid-external`) for JSON integration events published by the API/worker (`IIntegrationEventPublisher` / transactional outbox).

## Security and networking

- Prefer **managed identity** + `IntegrationEvents:ServiceBusFullyQualifiedNamespace` over connection strings in production.
- Do **not** expose the namespace on the public internet when a private network exists: set `enable_private_endpoint = true` and pass the private endpoints subnet plus the `privatelink.servicebus.windows.net` DNS zone id from `infra/terraform-private` (add a `azurerm_private_dns_zone` for Service Bus there if not already present, and link it to the workload VNet).
- IAM: optional role assignments grant **Data Sender** to the API identity and **Data Sender + Data Receiver** to the worker (outbox drain + subscription consumer).

## Application configuration

After apply, set:

| Setting | Source |
|--------|--------|
| `IntegrationEvents:ServiceBusFullyQualifiedNamespace` | `namespace_fqdn` output |
| `IntegrationEvents:QueueOrTopicName` | `topic_name` output |
| `IntegrationEvents:SubscriptionName` | `worker_subscription_name` output (worker only, when `ConsumerEnabled` is true) |
| `IntegrationEvents:TransactionalOutboxEnabled` | `true` when using SQL storage (see host validation rules) |

## Usage

```bash
cd infra/terraform-servicebus
terraform init
cp terraform.tfvars.example terraform.tfvars
# edit tfvars
terraform plan
terraform apply
```

Run `terraform fmt` before commit.
