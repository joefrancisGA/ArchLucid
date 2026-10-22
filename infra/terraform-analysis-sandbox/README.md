# Terraform analysis sandbox (SecureNow / inventory diagrams)

**Objective:** Stand up a **disposable** Azure footprint in a **new subscription** with the resource types and **connections** ArchLucid inventory diagrams most often expect — then tear it down with one command.

This root is **not** production ArchLucid. Container Apps run a **public placeholder image** (`containerapps-helloworld`). The value is **ARM topology + RBAC + app settings + ADF wiring** for extractor and Data flow analysis.

## What gets created

| Layer | Resources | Connections wired |
|-------|-----------|-------------------|
| Compute | Log Analytics, Container Apps Environment, API / Worker / UI / marketing UI | UI → API (`ARCHLUCID_API_BASE_URL`); SQL + blob + KV env on API/Worker |
| Data | SQL server + 3 databases (`archlucid`, `archlucid-dev`, `archlucidtenantdev`) | SQL firewall (Azure services); connection strings in app env |
| Storage | LRS storage account, blob containers, background-jobs **queue** | Blob/queue RBAC to API/Worker |
| Secrets | Key Vault (RBAC), bootstrap secrets | KV URI in app env; **Key Vault Secrets User** on API/Worker |
| RBAC | Role assignments | Blob Contributor, Queue Sender/Processor, KV Secrets User, **SQL DB Contributor** (database scope) |
| Optional ADF | Factory, blob + SQL linked services, copy pipeline | Linked services + pipeline activity inputs/outputs (declared movement) |
| Optional messaging | Service Bus Standard namespace + topic | SB Data Sender/Receiver RBAC; namespace hostname in app env |
| Optional events | Event Grid topic → storage subscription | Event routing edge |
| FinOps | Optional RG consumption budget | Email alerts at 80% / 100% forecast |

**Not included (cost / complexity):** Front Door, private endpoints, ACR, Azure OpenAI, Cosmos, multi-region failover.

## Prerequisites

- Terraform **>= 1.5.0**
- Azure CLI logged in with **Contributor** on the target subscription
- Entra **object ID** of the principal running apply (Key Vault bootstrap):

  ```bash
  az ad signed-in-user show --query id -o tsv
  ```

## Quick start

```bash
cd infra/terraform-analysis-sandbox
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set deployer_object_id and budget_contact_email

az login
az account set --subscription "<your-new-subscription-id>"

terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Or use the helper script from repo root:

```bash
./scripts/infra/apply-analysis-sandbox.sh
```

## Capture inventory for analysis

After apply succeeds:

1. Note outputs: `terraform output`
2. Run the Azure inventory package script against the subscription or resource group (see `scripts/azure/Get-ArchLucidAzurePackage.ps1` or SecureNow hosted extractor docs).
3. Ingest the ZIP in SecureNow and open **Data flow** / **Infrastructure** diagrams.

Expected diagram signal (when extractor companions include RBAC + app settings + ADF):

- API/Worker **may access** SQL, storage, Key Vault (RBAC)
- API/Worker **hostname / connection-string** hints (app settings)
- ADF **reads from / writes to** blob + SQL (when `enable_data_factory = true`)

## Tear down

```bash
cd infra/terraform-analysis-sandbox
terraform destroy
```

Or:

```bash
./scripts/infra/destroy-analysis-sandbox.sh
```

Key Vault uses `purge_soft_delete_on_destroy = true` so destroy does not leave soft-deleted vault names blocking re-apply.

If destroy fails on a stuck resource, delete resource group manually:

```bash
az group delete --name "$(terraform output -raw resource_group_name)" --yes --no-wait
```

## Cost

See **[COST_ESTIMATE.md](./COST_ESTIMATE.md)** for a monthly breakdown (idle vs light use). Set `budget_contact_email` and `monthly_budget_usd` for Azure Consumption budget alerts on the sandbox RG.

## Related

- [docs/securenow/ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md](../../docs/securenow/ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md) — how real ArchLucid DEV wiring maps to diagrams
- [docs/deployment/PILOT_PROFILE.md](../../docs/deployment/PILOT_PROFILE.md) — production vs pilot posture (this sandbox is leaner than pilot)
