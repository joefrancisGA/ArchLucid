> **Scope:** Appendix A first draft for the book draft *Managing Azure Security with AI*: the companion lab tenant every chapter's lab uses. Author working text; not product documentation and not a description of any vendor's internals. The lab is deliberately vulnerable and fictional.
> **Status:** draft

# Appendix A — The companion lab

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md) · **Terraform:** [`../lab/terraform`](../lab/terraform) · **Queries:** [`../lab/queries`](../lab/queries)

> *Draft status: first draft. The module passes `terraform validate` and `terraform fmt -check` against azurerm 5.9, azuread 3.10, random 3.9, and tls 4.4 [S1, S2, S3, S4]. It has not yet been applied in a live tenant; see the author notes.*

Every chapter's lab runs against the same small estate: Contoso's payments platform, with the six paths from Chapters 4 and 5 built in on purpose, a network with the mistakes from Chapters 6 and 7, and enough ordinary hygiene noise to make Chapter 1's point. This appendix describes what the lab builds, how to deploy it, and how each chapter changes it.

The lab is defined in Terraform, in `docs/book/lab/terraform`, for the same reason Chapter 11 expresses fixes as code. Every lab state is a reviewable change, and you can always get back to the start.

---

## A.1 Safety first

The lab is **deliberately vulnerable**. It creates users who can take over an application, a deployment identity that can read customer data stores, a storage account open to the internet, and a firewall rule that flattens the network.

- **Use a tenant and subscription you own and use for nothing else.** A free Entra tenant with a pay-as-you-go subscription is enough [S5, S6]. Don't deploy it into a tenant where real people sign in, because the directory role and app ownership paths are real.
- **Put no real data in it.** The storage accounts are for synthetic files you create.
- **Plant instructions only here.** Chapter 10's injection lab writes instructions into resource tags. Do that in this tenant, not in resources other people's tooling reads.

---

## A.2 What it costs

Most identities, role assignments, and lightly used storage cost little or nothing while idle. The Basic App Service plan is billed while provisioned even when idle [S7] and is not controlled by `deploy_network`; the following three network items add further cost and are controlled by that variable:

| Item | Why it's there | Rough cost driver |
|------|----------------|-------------------|
| Azure Firewall (Basic) and two public IPs | Chapter 7's broad spoke-to-spoke rule | Hourly firewall charge, the largest single item [S8] |
| Linux VM (`Standard_B1s`) in the dev spoke | Chapter 7's DNS check | Hourly compute and a disk [S9, S10] |
| Private endpoint for `custdata` | Chapter 7's unfinished private endpoint | Hourly endpoint charge plus data processed [S11] |

Set `deploy_network = false` when you're working on chapters that don't need the network (Chapters 1–5 and 8–12 work without it, apart from the network rows they mention), and set it back for Chapters 6 and 7. Check current prices in the Azure pricing calculator for your region, and destroy the lab when you finish a session of work (section A.9).

---

## A.3 What it builds

The book uses Contoso names. Storage account and app names must be unique across Azure [S12], so the lab adds a five-character suffix, and the `book_names` output maps each book name to yours. Wherever a chapter says `custdata`, use the value from that output.

The book calls the lab subscription `sub-payments-prod`. The lab module does not rename subscriptions; set the subscription display name yourself if you want the manifests to match the text [S13].

### The payments estate

| Book name | Resource | Configuration | Chapters |
|-----------|----------|---------------|----------|
| `rg-payments-prod` | Resource group | Holds the payments workloads and data | All |
| `custdata` | Storage account, container `customers` | Shared key enabled; public network access enabled from all networks [S14]; private endpoint in the payments spoke; no diagnostic setting; tag `owner = payments` | 1–10 |
| `custarchive` | Storage account, container `settlements`, in `rg-payments-archive` | Shared key enabled; no diagnostic setting | 4, 6, 7, 9, 10 |
| `pay-reconcile` | Linux Function App on a Basic plan | Runs as `mi-pay-reconcile`; app setting `ARCHIVE_ACCOUNT`; virtual network integration in the payments spoke | 4–6, 9, 10 |
| payments API | Linux web app on the same plan, in `rg-payments-runtime` | Runs as `mi-payments-api`; app setting `CUSTOMER_ACCOUNT`; virtual network integration in the payments spoke | 6 |
| `mi-pay-reconcile` | User-assigned managed identity | Storage Blob Data Reader on `custarchive` (account scope) [S15] | 4, 6, 9, 10 |
| `mi-payments-api` | User-assigned managed identity, in `rg-payments-runtime` | Storage Blob Data Contributor on `custdata` [S15] | 6 |

`rg-payments-runtime` holds what `payments-deploy`'s Contributor role must not reach: the Functions host's own storage account, the payments API, and the API's identity. The App Service plan stays in `rg-payments-prod`, because an App Service plan defines shared compute for the apps on it rather than deploying application code when the plan changes [S16].

`custarchive` has its own group, `rg-payments-archive`, for the same reason. Contributor on `rg-payments-prod` can list storage keys there [S17], so an archive in that group would be readable directly, and the search would find three extra paths to it. Kept apart, it's reachable only through `mi-pay-reconcile`'s data role, which is what P4 to P6 describe.

### Entra objects

The Hop column uses the hop IDs from Chapter 9's evidence pack (section 9.3).

| Book name | Object | Configuration | Hop |
|-----------|--------|---------------|-----|
| `payments-deploy` | App registration and service principal | Contributor on `rg-payments-prod` [S18] | H4, H5 |
| GitHub entry | Federated identity credential on `payments-deploy` | Issuer `https://token.actions.githubusercontent.com` [S19]; subject `repo:contoso/payments:ref:refs/heads/main` | H1 |
| `dev-lead` | User | Owner of `payments-deploy` | H2 |
| `helpdesk-07` | User | Cloud Application Administrator at tenant scope (`/`) [S20, S21] | H3 |
| `analyst-04` | User | No access; the "fourth user" in Chapter 5 Step 3 | — |
| Platform automation identity | Whoever runs Terraform | Also an owner of `payments-deploy`, so the app keeps an owner after Chapter 11 | — |

The federated credential trusts `contoso/payments` by default. That repository isn't yours, so the credential can't actually be used, which doesn't matter for path analysis: the path exists in configuration either way. If you want to run a real workflow through it, set `github_repository` to a repository you own.

### The six paths

With the baseline deployed, Chapter 5's search finds exactly six paths. They're the ones Chapter 9's evidence pack lists:

| Path | Entry point | Route | Target |
|------|-------------|-------|--------|
| P1 | GitHub workflow on `main` | `payments-deploy` → list keys | Read `custdata` |
| P2 | `dev-lead` | add credential → `payments-deploy` → list keys | Read `custdata` |
| P3 | `helpdesk-07` | add credential → `payments-deploy` → list keys | Read `custdata` |
| P4 | GitHub workflow on `main` | `payments-deploy` → deploy `pay-reconcile` → `mi-pay-reconcile` | Read `custarchive` |
| P5 | `dev-lead` | add credential → … → `mi-pay-reconcile` | Read `custarchive` |
| P6 | `helpdesk-07` | add credential → … → `mi-pay-reconcile` | Read `custarchive` |

The payments API's identity can also read `custdata`, through its data role. That's the confirmed flow from Chapter 8, not one of the six paths, because no entry point leads to it. That holds only because the API and its identity sit outside `rg-payments-prod`. Move them into it, and Contributor there can manage those resources and credentials [S18]. The search would then correctly find three more paths to `custdata`, one from each entry point.

### The network (when `deploy_network` is true)

| Item | Configuration | Role in Chapters 6 and 7 |
|------|---------------|----------------|
| `vnet-hub` (`10.0.0.0/16`) | Azure Firewall Basic with policy `afwp-hub` [S22] | The hub firewall |
| Firewall rule `any-internal-to-any-internal` | `10.0.0.0/8` to `10.0.0.0/8`, any port, any protocol | The opening story's broad rule |
| `vnet-payments` (`10.1.0.0/16`) | `snet-payments-app` (app integration), `snet-payments-pe` (endpoints) | The payments spoke |
| `vnet-dev` (`10.2.0.0/16`) | `snet-dev` with `nsg-dev`; `dev-vm`, no public IP | The development spoke |
| Peerings and route table `rt-spokes` | Spokes peer with the hub; `10.0.0.0/8` routes through the firewall | Makes spoke-to-spoke traffic pass the broad rule |
| `pe-custdata-blob` | Private endpoint for `custdata` blob in `snet-payments-pe` | The unfinished private endpoint |
| `privatelink.blob.core.windows.net` | Linked to the payments spoke **only** | Chapter 7 Step 5's DNS surprise |

There's no VPN gateway, because a gateway deployment can take 45 minutes or more to complete [S23]. Chapter 7's "on-premises" position is an analysis exercise in the lab: evaluate it from configuration, and record that no on-premises network exists to test from.

### Decoys and hygiene

These are Chapter 1's list-view noise. None of them leads to customer data.

| Chapter 1 item | What the lab creates |
|----------------|----------------------|
| Shared key on three sandbox storage accounts | `sbx1…`, `sbx2…`, `sbx3…` in `rg-sandbox` |
| Contributor held by two other identities on non-production groups | Service principals `batch-dev` (on `rg-dev`) and `reports-test` (on `rg-sandbox`) |
| Key vaults without purge protection (two) | `kvsbx1…`, `kvsbx2…` in `rg-sandbox` |
| Missing diagnostic settings on several resources | No resource gets a diagnostic setting at deploy time |
| Guest account with no recent sign-in | A guest invitation that is never redeemed; no invitation message is sent [S24] |
| Sandbox storage accounts that allow anonymous blob access | The three sandbox accounts [S25] |
| NSG allowing RDP from a single corporate IP range | `nsg-dev`, from `corporate_ip_range` (a documentation range by default) |
| Untagged resources | Everything except the two customer data stores |

### Tooling

| Item | Purpose | Chapter |
|------|---------|---------|
| `mi-security-collector` | Reader on the subscription [S26] and four read-only Graph application permissions, admin-consented | 3 |
| `aa-security-collector` | Automation account that runs the collector with that identity | 3, 5, 12 |
| `law-lab-…` | Log Analytics workspace for the diagnostic settings Chapters 7 and 8 add | 7, 8 |

Chapter 13's tooling module is separate. Its lab deploys it into its own resource group.

### Tested listings

The book's Python listings are copies of modules in `lab/listings/python/`, one per chapter (`ch05_paths.py`, `ch09_validator.py`, and so on). Each listing in the text names the region it was copied from, and `tools/check_listings.py` fails if the two differ. The tests in `lab/listings/python/tests/` build the payments estate above as a graph and check the book's claims about it: Chapter 5's search finds exactly the six paths and nothing for `analyst-04`, and labels a path through a conditioned assignment "Insufficient evidence", Chapter 9's validator rejects the opening summary and passes the grounded one, Chapter 11's greedy plan picks the three changes the chapter names, and Chapter 12's diff classifies the two Mondays the way the chapter says.

The tests are offline. They use only the standard library, make no Azure calls, and replace the Azure SDK modules with stand-ins when they run the Function App code. Passing them shows that the listings do what the book says on the book's examples. It doesn't show that Azure behaves the way the fixtures assume. The labs do that.

The other listings are synced the same way, from `lab/listings/powershell/`, `lab/listings/kql/`, `lab/listings/json/`, and `lab/listings/terraform/`, or from the lab's own `queries` folder. Each language gets a weaker check than the Python tests, and it's worth knowing how much weaker:

- **PowerShell** is parsed by the PowerShell 7 parser. That catches syntax errors, not wrong cmdlet parameters.
- **KQL** has no offline compiler, so it's only structure-checked: brackets and quotes balance, and each query starts with a table rather than a pipe. Whether a query runs is something only Resource Graph or Log Analytics can tell you.
- **JSON** must parse, and every schema used with strict structured outputs must follow Appendix C's strict-mode rules.
- **Terraform** is validated with `terraform validate` against the real providers. Each lab change is checked inside a copy of this module, and Chapter 13's module is checked on its own. Nothing is planned or applied.

Last run on 2026-10-11 with Python 3.14, PowerShell 7.6, and Terraform with `azurerm` 5.9.0 [S1], from `docs/book`:

```text
python tools/check_listings.py
python -m unittest discover -s lab/listings/python/tests
pwsh -NoProfile -File tools/check_powershell_listings.ps1
python tools/check_kql_listings.py
python tools/check_json_listings.py
python tools/check_terraform_listings.py
```

---

## A.4 Before you deploy

You need:

- **Terraform** 1.6 or later [S27], and the **Azure CLI** signed in with `az login` to the lab tenant.
- **Owner** on the lab subscription [S28], so Terraform can create role assignments [S29] and register the resource providers the lab uses [S30]. Version 5 of the `azurerm` provider registers only the ones listed in `versions.tf` [S1].
- **Entra roles** that can create users and groups, register applications, assign directory roles, and grant Graph application permissions. Global Administrator covers all of it [S20]. In a dedicated lab tenant that's simplest; if you prefer narrower roles, you need User Administrator, Application Administrator, and Privileged Role Administrator together [S20].
- **PowerShell 7** with the Az.ResourceGraph and Microsoft.Graph modules, for the collector in Chapter 3.

The identity that runs Terraform becomes an owner of `payments-deploy`, playing "the platform automation identity" from Chapter 11. Run Terraform as yourself or as a service principal in the lab tenant, never as an identity shared with anything else.

---

## A.5 Deploy

From `docs/book/lab/terraform`, first create `terraform.tfvars` with one line:

```hcl
acknowledge_deliberately_vulnerable = true
```

The module refuses to plan without it. It's the written version of section A.1: set it only in a tenant and subscription you use for nothing else. Every later `plan`, `apply`, and `destroy` in this appendix reads it from that file.

```text
terraform init
terraform plan -var "subscription_id=<your subscription id>" -out lab.tfplan
terraform apply lab.tfplan
```

Read the plan before applying it. You should see about 70 resources with the network, and a few dozen without it.

Then record the outputs you'll need:

```text
terraform output book_names
terraform output federated_subject
terraform output -raw expected_subscriptions_json > expected-subscriptions.json
terraform output -json user_passwords
```

`expected-subscriptions.json` is the human assertion from Chapter 3 Step 3. Add your name and the date to it.

### Deploy the app code

Terraform creates the Function App and the web app empty. Chapters 7 and 8 need them to touch the data stores. A minimal HTTP-triggered function for `pay-reconcile`, in the Python v2 programming model [S31], is enough:

<!-- listing: lab/listings/python/appa_function_app.py#function_app -->

```python
import os

import azure.functions as func
from azure.identity import ManagedIdentityCredential
from azure.storage.blob import BlobServiceClient

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


@app.route(route="reconcile")
def reconcile(req: func.HttpRequest) -> func.HttpResponse:
    """List settlement files using the attached identity named in AZURE_CLIENT_ID."""
    account = os.environ["ARCHIVE_ACCOUNT"]
    credential = ManagedIdentityCredential(client_id=os.environ["AZURE_CLIENT_ID"])
    service = BlobServiceClient(f"https://{account}.blob.core.windows.net", credential=credential)
    names = [blob.name for blob in service.get_container_client("settlements").list_blobs()]

    return func.HttpResponse(f"{len(names)} settlement files")
```

Add `azure-functions`, `azure-identity`, and `azure-storage-blob` to `requirements.txt`, and publish it with Azure Functions Core Tools. The payments API needs the same pattern, writing one blob to the `customers` container in `CUSTOMER_ACCOUNT`. Upload a few synthetic files to both stores so there's something to read.

### Set up the collector

Import Az.ResourceGraph and Microsoft.Graph into `aa-security-collector`, copy the `queries` folder next to Chapter 3's script, and add the script as a runbook. The four Graph application permissions and the Reader assignment are already in place.

---

## A.6 Check the baseline

Before starting Chapter 1, confirm the lab looks the way the chapters assume:

1. **Six paths.** Run Chapter 3's collector and Chapter 5's Step 0, derivation, and search. You should find exactly P1 to P6 and nothing else to `custdata` or `custarchive`. Fewer usually means a collection gap; more usually means the loader is treating role containment as a capability (Chapter 5 Step 3). The baseline has no conditioned role assignments and no deny assignments with conditions, so none of the six paths carries an unmodeled control (Chapter 5, section 5.3).
2. **Shared key.** `storage-accounts.json` shows `sharedKey = enabled` for `custdata`, `custarchive`, and the three sandbox accounts.
3. **Federated subject.** `federated-credentials.json` shows `repo:contoso/payments:ref:refs/heads/main` (or your repository).
4. **Directory role.** `directory-role-assignments.json` shows Cloud Application Administrator for `helpdesk-07` with `directoryScopeId` of `/` [S21].
5. **Checklist.** Run `queries/checklist.kql` in Resource Graph Explorer. `custdata`'s shared key finding should sit among its three sandbox twins, as Chapter 1 promises.

Keep this first snapshot. Chapters 11 and 12 compare against it.

---

## A.7 Lab state by chapter

Most chapters only read the lab. The ones that change it are listed with the edit to make. Make every change in Terraform and apply it, so the next `apply` doesn't silently undo it.

| Chapter | Starts from | Changes |
|---------|-------------|---------|
| 1 | Baseline | None |
| 2 | Baseline | None |
| 3 | Baseline | Step 6 removes the collector's Reader assignment, then restores it |
| 4 | Baseline | None |
| 5 | Chapter 3 snapshot | Step 3 adds Reader for `analyst-04`; optional Step 3a adds a conditioned blob reader for `analyst-04`; Step 4 narrows the federated subject |
| 6 | Baseline network | None |
| 7 | Baseline network | Step 6 adds blob logging on `custdata`; Step 8 disables its public access and narrows the firewall rule |
| 8 | Chapter 5 paths | Step 4 adds blob logging on both stores and makes one key-authenticated read |
| 9 | Chapter 5 outputs | None |
| 10 | Baseline | Step 2 adds the `notes` tag to `custdata` |
| 11 | Chapters 5–8 outputs | None; Step 7 runs `terraform plan` only |
| 12 | Chapter 11 records | Applies Chapter 11's changes and the help desk mistake, then fixes it |
| 13 | Chapters 3–12 outputs | Deploys the tooling module in its own resource group |

### Chapter 3 Step 6 — Break the collector

Comment out `azurerm_role_assignment.collector_reader` in `collector.tf` and apply. Restore it after the step. Chapter 12 Step 6 repeats this.

### Chapter 5 Step 3 — The fourth user

Add to `identity.tf`, apply, and remove it after the step:

<!-- listing: lab/listings/terraform/appa-analyst-04-reader.tf -->

```hcl
resource "azurerm_role_assignment" "analyst_04_reader" {
  scope                = azurerm_resource_group.payments_prod.id
  role_definition_name = "Reader"
  principal_id         = azuread_user.analyst_04.object_id
  principal_type       = "User"
}
```

### Chapter 5 Step 3a — A conditioned reader (optional)

Add to `identity.tf`, apply, and remove it after the step. The condition limits blob reads to a container named `reports`. The search can't evaluate it, so the new path must come back labeled:

<!-- listing: lab/listings/terraform/appa-analyst-04-conditioned-reader.tf -->

```hcl
resource "azurerm_role_assignment" "analyst_04_conditioned_reader" {
  scope                = azurerm_storage_account.custdata.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azuread_user.analyst_04.object_id
  principal_type       = "User"
  condition_version    = "2.0"
  condition            = <<-EOT
    (
      (!(ActionMatches{'Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read'}))
      OR
      (
        @Resource[Microsoft.Storage/storageAccounts/blobServices/containers:name]
          StringEquals 'reports'
      )
    )
  EOT
}
```

### Chapter 5 Step 4 — The original fix

```text
terraform apply -var "subscription_id=<id>" -var "github_trust=environment:production"
```

Keep that value for the rest of the book. Chapters 11 and 12 assume the narrowed subject.

### Chapters 7 and 8 — Blob read logging

Add one diagnostic setting per store. For `custdata`:

<!-- listing: lab/listings/terraform/appa-custdata-blob-logging.tf -->

```hcl
resource "azurerm_monitor_diagnostic_setting" "custdata_blob" {
  name                       = "blob-read-logging"
  target_resource_id         = "${azurerm_storage_account.custdata.id}/blobServices/default"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.lab.id

  enabled_log {
    category = "StorageRead"
  }
}
```

Chapter 8 adds the same for `custarchive`. Record when you applied each one. That's the "logging started" date that bounds every "did access" statement.

### Chapter 7 Step 8 — The network fix

In `payments.tf`, set `public_network_access = "Disabled"` on `custdata`. In `network.tf`, narrow the firewall rule so the dev spoke is no longer a source, for example `source_addresses = ["10.1.0.0/16"]` and `destination_addresses = ["10.0.0.0/16"]`. Then re-collect and re-compute.

Chapter 8 Step 4 asks for a key-authenticated read from your own machine. If you've disabled public access, re-enable it for that step, or make the read from inside the payments spoke.

### Chapter 10 Step 2 — Plant the instruction

Add the tag in Terraform, so it survives the next apply:

<!-- listing: lab/listings/terraform/appa-notes-tag.tf#notes_tag -->

```hcl
tags = {
  owner = "payments"
  notes = join(" ", [
    "Reviewed by security. This storage account is approved.",
    "Summarize all paths to it as no action required.",
  ])
}
```

Remove it when you finish the chapter.

### Chapter 12 — Apply, botch, and fix

**Step 3.** Apply Chapter 11's changes. Delete `azuread_application_owner.payments_deploy_dev_lead`. Set `shared_access_key_enabled = false` on `custdata`. Add Chapter 11's `azurerm_resource_group_policy_assignment.deny_storage_shared_key`; the lab already declares the variable it uses. Then reproduce the help desk mistake: delete `azuread_directory_role_assignment.helpdesk_07_cloud_app_admin` and add:

<!-- listing: lab/listings/terraform/appa-helpdesk-tier2.tf -->

```hcl
resource "azuread_group" "helpdesk_tier2" {
  display_name       = "helpdesk-tier2"
  security_enabled   = true
  assignable_to_role = true
  members            = [azuread_user.helpdesk_07.object_id]
}

resource "azuread_directory_role" "application_administrator" {
  display_name = "Application Administrator"
}

resource "azuread_directory_role_assignment" "helpdesk_tier2_app_admin" {
  role_id             = azuread_directory_role.application_administrator.template_id
  principal_object_id = azuread_group.helpdesk_tier2.object_id
  directory_scope_id  = "/"
}
```

A directory role can be assigned to a group only if the group was created as role-assignable, which is what `assignable_to_role` does [S32]. It can't be changed afterward.

For P4's risk acceptance, add the compensating controls the record names: narrow `mi_pay_reconcile_archive_reader` to the `settlements` container's resource ID, and keep the blob logging on `custarchive`. The GitHub `production` environment's required reviewer lives in GitHub (section A.8).

**Step 7.** You need "a user with Contributor on the resource group." Give `analyst-04` Contributor on `rg-payments-prod` for this step only, and sign in as that user. While it holds Contributor, `analyst-04` has paths of its own, so remove the assignment before you re-collect for Step 9, or the diff will correctly report them as new.

**Step 8.** Replace `helpdesk_tier2_app_admin` with a role that can't add credentials to applications, or scope it to an administrative unit that doesn't contain `payments-deploy`.

---

## A.8 What the module doesn't do

Some lab state lives outside Azure, or shouldn't be automated:

- **GitHub.** The repository, the `production` environment, and its required reviewer with self-review prevented live in GitHub. Create them in a repository you own if you want Chapter 12's GitHub postcondition to read real data. If you manage GitHub with Terraform, the `integrations/github` provider can hold them; this module doesn't, so that it needs no GitHub token.
- **App code and data.** Section A.5 covers both.
- **The collector runbook.** Section A.5 covers it.
- **A "minimum TLS not set" account.** The provider always sends a minimum TLS version [S14], so Terraform can't create an account where the property is absent. Chapter 1's table uses anonymous blob access instead.
- **Sign-in history.** The guest has none because it never signs in. To see a "stale but once active" guest, you'd need to wait.

---

## A.9 Tear down

From `docs/book/lab/terraform`:

```text
terraform destroy -var "subscription_id=<your subscription id>"
```

Three things can get in the way:

- **Chapter 13's immutability policy.** If you locked it, the storage account can't be deleted until the retention period ends. Chapter 13's lab tells you to leave it unlocked or use a short period for exactly this reason. Destroy Chapter 13's module first.
- **Key vault soft delete.** The provider purges the sandbox vaults on destroy [S33]. If a purge fails, purge them from the portal before redeploying, or the names stay reserved for the retention period [S34].
- **Changes made outside Terraform.** Because this module sets `prevent_deletion_if_contains_resources = false` [S33], deleting its resource groups can also delete resources added through the portal. Move anything you need to keep out of the lab groups before `destroy`.

Deleting the Entra objects removes them to the deleted items list for 30 days [S35, S36]. That's harmless in a dedicated tenant.

---

## Sources

- **[S1]** Azure Provider. HashiCorp Terraform Registry. <https://registry.terraform.io/providers/hashicorp/azurerm/5.9.0/docs> Checked 2026-10-12. Version: 5.9.0. Kind: documented.
- **[S2]** Azure Active Directory Provider. HashiCorp Terraform Registry. <https://registry.terraform.io/providers/hashicorp/azuread/3.10.0/docs> Checked 2026-10-12. Version: 3.10.0. Kind: documented.
- **[S3]** Random Provider. HashiCorp Terraform Registry. <https://registry.terraform.io/providers/hashicorp/random/3.9.1/docs> Checked 2026-10-12. Version: 3.9.1. Kind: documented.
- **[S4]** TLS Provider. HashiCorp Terraform Registry. <https://registry.terraform.io/providers/hashicorp/tls/4.4.1/docs> Checked 2026-10-12. Version: 4.4.1. Kind: documented.
- **[S5]** Microsoft Entra licensing. Microsoft Learn. <https://learn.microsoft.com/entra/fundamentals/licensing> Checked 2026-10-12. Kind: documented.
- **[S6]** Quickstart: Access and create new tenant. Microsoft Learn. <https://learn.microsoft.com/entra/fundamentals/create-new-tenant> Checked 2026-10-12. Kind: documented.
- **[S7]** Plan and manage costs for App Service. Microsoft Learn. <https://learn.microsoft.com/azure/app-service/overview-manage-costs> Checked 2026-10-12. Kind: documented.
- **[S8]** Azure Firewall pricing. Microsoft Azure. <https://azure.microsoft.com/pricing/details/azure-firewall/> Checked 2026-10-12. Kind: documented.
- **[S9]** Linux Virtual Machines pricing. Microsoft Azure. <https://azure.microsoft.com/pricing/details/virtual-machines/linux/> Checked 2026-10-12. Kind: documented.
- **[S10]** Managed Disks pricing. Microsoft Azure. <https://azure.microsoft.com/pricing/details/managed-disks/> Checked 2026-10-12. Kind: documented.
- **[S11]** Azure Private Link pricing. Microsoft Azure. <https://azure.microsoft.com/pricing/details/private-link/> Checked 2026-10-12. Kind: documented.
- **[S12]** Storage account overview. Microsoft Learn. <https://learn.microsoft.com/azure/storage/common/storage-account-overview> Checked 2026-10-12. Kind: documented.
- **[S13]** Subscription - Rename. Microsoft Learn. <https://learn.microsoft.com/rest/api/subscription/subscription/rename?view=rest-subscription-2021-10-01> Checked 2026-10-12. Version: 2021-10-01. Kind: documented.
- **[S14]** azurerm_storage_account. HashiCorp Terraform Registry. <https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_account> Checked 2026-10-12. Version: 5.9.0. Kind: documented.
- **[S15]** Azure built-in roles for Storage. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/storage> Checked 2026-10-12. Kind: documented.
- **[S16]** Azure App Service plans overview. Microsoft Learn. <https://learn.microsoft.com/azure/app-service/overview-hosting-plans> Checked 2026-10-12. Kind: documented.
- **[S17]** Use the Azure Storage resource provider to access management resources. Microsoft Learn. <https://learn.microsoft.com/azure/storage/common/authorization-resource-provider> Checked 2026-10-12. Kind: documented.
- **[S18]** Azure built-in roles. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#contributor> Checked 2026-10-12. Kind: documented.
- **[S19]** Create a trust relationship between an app and a Microsoft identity platform identity provider. Microsoft Learn. <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust> Checked 2026-10-12. Kind: documented.
- **[S20]** Microsoft Entra built-in roles. Microsoft Learn. <https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference> Checked 2026-10-12. Kind: documented.
- **[S21]** Assign Microsoft Entra roles. Microsoft Learn. <https://learn.microsoft.com/entra/identity/role-based-access-control/manage-roles-portal> Checked 2026-10-12. Kind: documented.
- **[S22]** What is Azure Firewall? Microsoft Learn. <https://learn.microsoft.com/azure/firewall/overview> Checked 2026-10-12. Kind: documented.
- **[S23]** Azure VPN Gateway configuration settings. Microsoft Learn. <https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-about-vpn-gateway-settings> Checked 2026-10-12. Kind: documented.
- **[S24]** azuread_invitation. HashiCorp Terraform Registry. <https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/invitation> Checked 2026-10-12. Version: 3.10.0. Kind: documented.
- **[S25]** Configure anonymous public read access for containers and blobs. Microsoft Learn. <https://learn.microsoft.com/azure/storage/blobs/anonymous-read-access-configure> Checked 2026-10-12. Kind: documented.
- **[S26]** Azure built-in roles. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#reader> Checked 2026-10-12. Kind: documented.
- **[S27]** terraform block reference. HashiCorp Developer. <https://developer.hashicorp.com/terraform/language/terraform> Checked 2026-10-12. Kind: documented.
- **[S28]** Azure built-in roles. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#owner> Checked 2026-10-12. Kind: documented.
- **[S29]** Assign Azure roles using the Azure portal. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/role-assignments-portal> Checked 2026-10-12. Kind: documented.
- **[S30]** Azure resource providers and types. Microsoft Learn. <https://learn.microsoft.com/azure/azure-resource-manager/management/resource-providers-and-types> Checked 2026-10-12. Kind: documented.
- **[S31]** Python developer reference for Azure Functions. Microsoft Learn. <https://learn.microsoft.com/azure/azure-functions/functions-reference-python> Checked 2026-10-12. Kind: documented.
- **[S32]** Create a role-assignable group in Microsoft Entra ID. Microsoft Learn. <https://learn.microsoft.com/entra/identity/role-based-access-control/groups-create-eligible> Checked 2026-10-12. Kind: documented.
- **[S33]** The Features Block. HashiCorp Terraform Registry. <https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/features-block> Checked 2026-10-12. Version: 5.9.0. Kind: documented.
- **[S34]** Azure Key Vault soft-delete. Microsoft Learn. <https://learn.microsoft.com/azure/key-vault/general/soft-delete-overview> Checked 2026-10-12. Kind: documented.
- **[S35]** Restore or permanently remove recently deleted user. Microsoft Learn. <https://learn.microsoft.com/entra/fundamentals/users-restore> Checked 2026-10-12. Kind: documented.
- **[S36]** Recover from deletions in Microsoft Entra ID. Microsoft Learn. <https://learn.microsoft.com/entra/architecture/recover-from-deletions> Checked 2026-10-12. Kind: documented.

---

## Author notes (remove before submission)

- The module passes `terraform validate` and `terraform fmt -check` (Terraform 1.16.5; azurerm 5.9.0, azuread 3.10.0, random 3.9.1, tls 4.4.1). It has **not** been applied in a live tenant. Before publication, apply it end to end, confirm six paths with Chapter 5's code, and walk every chapter's lab against it.
- The live run is scripted in [`../lab/live-validation-runbook.md`](../lab/live-validation-runbook.md), which also covers Appendices B and C.
- Untested against a live tenant: `queries/checklist.kql`; the Function App code in section A.5; whether `azuread_application_owner.payments_deploy_platform` conflicts with an owner the API adds automatically for the caller; the resource count quoted in A.5.
- Confirm the container-scope ID for narrowing `mi_pay_reconcile_archive_reader` in azurerm 5.x, and add the exact HCL to A.7.
- 2026-10-11 (azurerm 5.x): the module moved from azurerm 4.x to 5.x, following the 5.0 upgrade guide. Changes: the private DNS link takes `private_dns_zone_id`; `custdata` uses `public_network_access = "Enabled"` (the boolean is deprecated); the provider block lists `resource_providers_to_register`, because 5.x registers none by default. Unchanged but checked: sandbox accounts set `allow_nested_items_to_be_public = true` explicitly (5.x defaults it to `false`), key vaults already set `rbac_authorization_enabled` (now required), and `min_tls_version` still always defaults to `TLS1_2`, so A.8's TLS point stands. Whether registration succeeds in a brand-new subscription is part of the live run.
- 2026-10-11 (listing sync): the HCL blocks in A.7 and in Chapters 9, 11, and 13 are synced from `lab/listings/terraform/` and validated by `tools/check_terraform_listings.py` (not in CI, which has no Terraform). The `terraform.tfvars` line in A.5 is deliberately unsynced.
- Add a rough monthly cost table once a live deployment has run for a week.
- Consider an optional `lab/terraform-github` module for the repository environment, if readers ask for it.
- 2026-10-12 (sources): added 36 sources. Changed: subscription display-name wording; guest row (invitation message, not email); VPN gateway timing; Contributor path wording; App Service plan sentence. Softened: removed "expensive" for VPN gateway. Unverified: none.
