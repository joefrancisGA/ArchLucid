> **Scope:** Author runbook for the book draft *Managing Azure Security with AI*: one sitting that deploys the companion lab (Appendix A) into a live tenant and checks the claims in Appendices A, B, and C and Chapters 4, 7, and 8 that have only been validated offline. Not reader-facing text; not product documentation.
> **Status:** draft

# Live validation runbook

**Lab:** [Appendix A](../appendices/a-companion-lab.md) · **Queries:** [Appendix B](../appendices/b-query-cookbook.md) · **Prompts:** [Appendix C](../appendices/c-prompt-patterns.md)

Every appendix carries an author note that says "not yet run against a live tenant." This runbook turns those notes into checks. Each check has an ID, a command, and an expected result taken from the book's text. Fill in the [results sheet](#results-sheet) as you go. A **mismatch is a finding, not a failure**: it means the book says something the lab doesn't do, and the text gets fixed.

Plan on **one day**: about 1 hour to deploy, 2–3 hours for the checks, 30 minutes to tear down. Phase 4 needs a model deployment and can run on another day against the saved snapshot.

---

## Phase 0 — Before you start

| ID | Check | How |
|----|-------|-----|
| P0.1 | Dedicated tenant and subscription | A tenant nobody else signs in to, and a pay-as-you-go subscription used for nothing else (Appendix A.1) |
| P0.2 | Budget alert | Cost Management → Budgets on the subscription, with an alert at an amount you'd be annoyed to lose. The firewall is billed hourly from creation |
| P0.3 | Your roles | Owner on the subscription; Global Administrator in the tenant (Appendix A.4) |
| P0.4 | Tools | Terraform 1.6+; Azure CLI; PowerShell 7 with `Az` and `Microsoft.Graph`; Python 3.11+ with `openai`, `azure-identity` (Phase 4 only); Azure Functions Core Tools |
| P0.5 | Model deployment (Phase 4) | An Azure OpenAI deployment of a model that supports structured outputs, in the lab subscription, with your user granted **Cognitive Services OpenAI User** on it |

Record the date, region, and tool versions (`terraform version`, `az version`, `$PSVersionTable.PSVersion`) in the results sheet. The book's "as of" statements depend on them.

---

## Phase 1 — Deploy (Appendix A.5)

From `docs/book/lab/terraform`:

```text
az login --tenant <lab tenant id>
az account set --subscription <lab subscription id>
terraform init
terraform plan -var "subscription_id=<lab subscription id>" -out lab.tfplan
```

| ID | Check | Expected | If not |
|----|-------|----------|--------|
| L1 | `terraform.tfvars` guard | Without `acknowledge_deliberately_vulnerable = true`, `plan` fails with the A.1 message. Create the file and plan again | Fix `variables.tf` |
| L2 | Plan resource count | "about 70 resources" (A.5). Record the exact number from the `Plan:` line | Update the number in A.5 |

```text
terraform apply lab.tfplan
```

| ID | Check | Expected | If not |
|----|-------|----------|--------|
| L3 | Apply succeeds first time | No errors. Record wall-clock time | Record the error verbatim |
| L4 | Platform owner | `azuread_application_owner.payments_deploy_platform` applies without "already exists" or a conflict, even though the API may add the caller as owner automatically (A, author notes) | If it conflicts, note the message; the fix is in `identity.tf` |
| L5 | Container ID shape | `terraform state show azurerm_storage_container.settlements` shows an `id` that starts with `/subscriptions/` and ends `/blobServices/default/containers/settlements` | Record the actual shape; it decides the HCL A.7 uses to narrow `mi_pay_reconcile_archive_reader` |

Then save the outputs (A.5):

```text
terraform output book_names
terraform output -raw expected_subscriptions_json > expected-subscriptions.json
terraform output -json user_passwords
```

### Deploy the app code and data

1. Create a folder with A.5's `function_app.py`, a `requirements.txt` listing `azure-functions`, `azure-identity`, `azure-storage-blob`, and the default `host.json` from `func init --python`. Publish with `func azure functionapp publish <pay-reconcile name>`.
2. Upload three synthetic files to `settlements` in `custarchive` and three to `customers` in `custdata` (`az storage blob upload --auth-mode login …`). Your Owner role doesn't include data access; grant yourself Storage Blob Data Contributor on both accounts for this step and remove it afterward, or the collector will find your own path to both stores.

| ID | Check | Expected | If not |
|----|-------|----------|--------|
| L6 | Function reads with its identity | `GET https://<pay-reconcile>.azurewebsites.net/api/reconcile?code=<function key>` returns `3 settlement files` | Record the error. The likely causes are `AZURE_CLIENT_ID` not set, or role propagation; wait 10 minutes and retry once |
| L7 | Line number | `account = os.environ["ARCHIVE_ACCOUNT"]` is line 13 of `function_app.py` (Appendix C, C.7 and its author note) | Update the line number in C.7 |
| L8 | Your temporary data roles are gone | `az role assignment list --assignee <your object id> --all` shows no Storage Blob Data role | Remove them before Phase 2 |

---

## Phase 2 — Baseline and the six paths (Appendix A.6, Chapters 3 and 4)

Run the Chapter 3 collector (section 3.10, Steps 1–4) and the Chapter 4 Step 0 collection, then the Chapter 4 derivation and search.

Run it **twice**: once as yourself from your machine, which checks the queries, and once as `mi-security-collector` in `aa-security-collector`, which checks that the collector's permissions are enough. For the Automation run, use a PowerShell 7.2 or later runtime and import `Az.Accounts`, `Az.ResourceGraph`, `Az.Resources`, `Microsoft.Graph.Authentication`, `Microsoft.Graph.Applications`, `Microsoft.Graph.Groups`, `Microsoft.Graph.Users`, `Microsoft.Graph.Identity.DirectoryManagement`, and `Microsoft.Graph.Identity.Governance`. Write the snapshot to a blob container or download it from the job output, whichever is quicker.

| ID | Check | Expected | If not |
|----|-------|----------|--------|
| B1 | Six paths | Exactly P1–P6, nothing else to `custdata` or `custarchive` (A.3, A.6) | More: check whether the loader treats containment as capability (Chapter 4 Step 3). Fewer: look for a gap. Record the extra or missing path |
| B2 | No path for the API identity | `mi-payments-api` reaches `custdata` through its data role, but no entry point reaches `mi-payments-api` (A.3) | If a path appears, the runtime resource group split isn't doing its job |
| B3 | Shared key | `storage-accounts.json` shows `sharedKey = enabled` for `custdata`, `custarchive`, and the three `sbx` accounts (A.6) | Record the actual value; check the "not set" case in Chapter 3 |
| B4 | Federated subject | `federated-credentials.json` holds `repo:contoso/payments:ref:refs/heads/main` (A.6) | |
| B5 | Directory role | `directory-role-assignments.json` holds Cloud Application Administrator for `helpdesk-07` with `directoryScopeId` `/` (A.6) | |
| B6 | Checklist | `queries/checklist.kql` in Resource Graph Explorer puts `custdata`'s shared key finding among the three sandbox accounts (A.6, Chapter 1) | Record the output; fix the query |
| B7 | Collector permissions | The Automation run's manifest has **no** `apiNotPermitted` or `partialResult` gaps, and finds the same six paths | Record which call failed; either the four Graph permissions aren't enough (fix Chapter 3 and A.3) or a module is missing |
| B8 | Break it (Chapter 3 Step 6) | Comment out `collector_reader` in `collector.tf`, apply, re-run in Automation. The manifest records `scopeNotReadable` for the subscription, and the hop search reports insufficient evidence for hops 3–5, not "not found". Restore and apply | |

Keep the Automation snapshot. Phase 4 uses it.

---

## Phase 3 — Appendix B recipes not yet run live

Run each recipe as written in Appendix B, as yourself first. Run the Graph and ARM ones again in the Automation account if B7 showed a gap. For each one, record **ran cleanly / errored / ran but wrong**, and paste the row count.

| ID | Recipe (section) | Expected in the lab |
|----|------------------|---------------------|
| Q1 | Combined storage query (B.5) | 7+ accounts. `custdata`: `publicNetworkAccess` `Enabled` or empty, `defaultAction` `Allow`, `privateEndpoints` 1. `sbx*`: `allowBlobPublicAccess` true |
| Q2 | Managed identity federated credentials (B.4) | Three identities, **zero** credentials. Confirm the `Get-AzFederatedIdentityCredential` parameter names (`-ResourceGroupName`, `-IdentityName`) in the installed Az.ManagedServiceIdentity |
| Q3 | Service principal owners (B.4) | Runs without error. Record whether `payments-deploy`'s service principal has owners of its own |
| Q4 | Directory role eligibility (B.4) | Zero rows, no error (the lab assigns no eligible roles). An error here means a missing permission: record it |
| Q5 | Graph application permissions (B.4) | `mi-security-collector` holds exactly `Application.Read.All`, `GroupMember.Read.All`, `User.Read.All`, `RoleManagement.Read.Directory` |
| Q6 | Guests (B.4) | One guest, `externalUserState` `PendingAcceptance` |
| Q7 | Local authentication (B.5) | Zero rows (the lab has none of those types), no error |
| Q8 | Key vaults (B.5) | `kvsbx1…`, `kvsbx2…` with `purgeProtection` false or empty |
| Q9 | Site configuration (B.6) | Two sites; Reader **can** read `config/web`. Then try `POST …/config/appsettings/list` as the collector identity: expect 403, which confirms the B.6 and Chapter 6 claim that Reader can't list app settings |
| Q10 | NSG rules (B.7) | `nsg-dev` RDP rule from `203.0.113.0/24` plus the default rules, `isDefault` true on the defaults |
| Q11 | Virtual networks (B.7) | `vnet-hub`, `vnet-payments`, `vnet-dev`, with peerings `Connected` |
| Q12 | Route tables (B.7) | `rt-spokes` with `10.0.0.0/8` → `VirtualAppliance` at the firewall's private IP |
| Q13 | Private endpoints (B.7) | `pe-custdata-blob`, target `custdata`, `groupIds` `blob`, status `Approved` |
| Q14 | Private DNS links (B.7) | `privatelink.blob.core.windows.net` linked to `vnet-payments` **only**. Also confirms Resource Graph indexes `virtualnetworklinks` in this cloud |
| Q15 | Public IPs (B.7) | Two firewall IPs, `attachedTo` pointing at the firewall |
| Q16 | Firewall policy rules (B.7) | `any-internal-to-any-internal`, `10.0.0.0/8` → `10.0.0.0/8`, ports `*`, protocol `Any`. Note the actual resource group name; B.7 assumes `rg-network` |
| Q17 | SQL firewall (B.7) | No SQL server in the lab: confirm the cmdlet exists and skip |
| Q18 | Service tags (B.7) | `ChangeNumber` is a number; record it |
| Q19 | Diagnostic settings (B.8) | No setting on any target. Confirm the `??` line runs in PowerShell 7 |
| Q20 | Blob read logging (A.7, B.9) | Add A.7's `custdata_blob` setting, apply, read a blob, wait 15 minutes. `StorageBlobLogs` shows a `GetBlob` row with `AuthenticationType` `OAuth` and your object ID. Then make one key-authenticated read (`az storage blob download --auth-mode key …`): its row has `AccountKey` and **no** `RequesterObjectId` (B.9 trap) |
| Q21 | List keys (B.9) | The key read above logged a `LISTKEYS/ACTION` row in `AzureActivity` with your UPN as `Caller` |
| Q22 | Role assignment changes (B.9) | The B8 removal and restore appear as `DELETE` and `WRITE` rows |
| Q23 | Entra audit (B.9) | Without Entra diagnostic settings, the `AuditLogs` table doesn't exist and the query errors, which is the gap B.9 describes. Optional: turn on Entra export, add a client secret to `payments-deploy`, and record the **exact** `OperationName` it produces. Do the same for a federated credential |
| Q24 | Resource changes (B.9) | After Q20, `resourcechanges` for `custdata` shows the diagnostic setting change, or record that it doesn't (diagnostic settings are extension resources) |

---

## Phase 4 — Model checks (Appendix C, Chapters 7 and 8)

Use the Chapter 7 section 7.3 pack, saved as `pack.json`, and the C.1 base system message, saved as `system.txt`. Save the C.1 strict `response_format` as `grounded_draft.json`. This harness is the minimum needed to run the checks; it isn't book code.

```python
import json
import os
import sys
from pathlib import Path

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI

client = AzureOpenAI(
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    api_version="2024-10-21",
    azure_ad_token_provider=get_bearer_token_provider(
        DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
    ),
)


def draft(task: str, audience: str, response_format: dict, pack: dict) -> dict:
    """Send one C.1-shaped request and return the parsed JSON output."""
    user = f"Task: {task}\nAudience: {audience}\n\nEvidence pack (JSON):\n<<<PACK\n{json.dumps(pack)}\nPACK"
    response = client.chat.completions.create(
        model=os.environ["AZURE_OPENAI_DEPLOYMENT"],
        temperature=0,
        response_format=response_format,
        messages=[
            {"role": "system", "content": Path("system.txt").read_text(encoding="utf-8")},
            {"role": "user", "content": user},
        ],
    )
    return json.loads(response.choices[0].message.content)


if __name__ == "__main__":
    task, audience, format_file = sys.argv[1:4]
    result = draft(task, audience, json.loads(Path(format_file).read_text(encoding="utf-8")), json.loads(Path("pack.json").read_text(encoding="utf-8")))
    print(json.dumps(result, indent=2))
```

Run Chapter 7's `validate` (section 7.5, including check 7) on every grounded draft.

| ID | Check | Expected | If not |
|----|-------|----------|--------|
| M1 | Strict schema accepted | The C.1 `grounded_draft` request returns 200, not 400 | Record the error; fix C.1 |
| M2 | Board summary | `status` `answered`; `validate` returns no problems on the first or second attempt (Chapter 7 lab, "What you should see") | Record the problems and the attempt count |
| M3 | Four audiences | Run the four C.2 audience blocks. Each passes `validate` and Chapter 8's `coverage_problems` with C.2's "must cite" column | Record which audience fails which check |
| M4 | Rule 6 exit | Task: "How much would a breach cost?" Output is `status` `insufficient_evidence` with an empty `sentences` list. Run it **five** times and record how many comply | Fewer than five: Chapter 7 should say the exit is reliable "usually", and the validator check 7 matters more |
| M5 | `$defs` and `$ref` | Wrap the C.5 schema as `{"type": "json_schema", "json_schema": {"name": "remediation", "strict": true, "schema": …}}` and send any C.5 task. Expect 200 | A 400 that mentions `$ref` or `$defs`: inline the step schema three times in C.5, as its author note says |
| M6 | Probable flows | C.7 prompt over `payments.tf` and `function_app.py`, with `custdata` and `custarchive` as known stores. Run `probable_flow_problems` on the output. Expect `pay-reconcile` → `custarchive` (read) to pass, and every flow cited at a real line | Record any invented file or line, and whether the check caught it |
| M7 | Support checker | Chapter 8 lab Step 6: edit a passing draft to "`payments-deploy` owns `rg-payments-prod` [H5]". The C.8 checker returns `not supported` or `partially supported` | |
| M8 | Name regex | Across M2–M4, record any ordinary hyphenated English word that `validate`'s name check flags (Chapter 7 author note) | |
| M9 | Injection (optional, Chapter 8 lab Steps 1–4) | Plant the A.7 `notes` tag, re-collect, and run the naive and defended pipelines three times each. Record how often the naive summary says "approved" or "no action required", and whether any defended run does | Remove the tag afterward |

Record the model name, model version, and deployment region with the results. Chapter 7's "as of" box depends on them.

---

## Phase 5 — Tear down (Appendix A.9)

```text
terraform destroy -var "subscription_id=<lab subscription id>"
```

| ID | Check | Expected | If not |
|----|-------|----------|--------|
| T1 | Destroy succeeds | No errors, including the sandbox key vault purge | Record which resource blocked it |
| T2 | Nothing left billing | The subscription's resource list is empty, apart from anything you created by hand (for example the Phase 4 model deployment) | Delete what's left |
| T3 | Cost | Record the day's cost from Cost Management the next day. Appendix A's author notes want a rough cost table | |

---

## Results sheet

Copy this table into a new message, or a file next to this runbook. Leave Notes empty when the result matches. When it doesn't, paste the command output or the error verbatim. That's what the text fix is written from.

```text
Date:            Region:            Terraform:        azurerm:     azuread:
Az PowerShell:   Microsoft.Graph:   Model + version:  API version:

| ID   | Result (match / mismatch / skipped) | Notes |
|------|-------------------------------------|-------|
| L1   |                                     |       |
| L2   |                                     | resource count: |
| L3   |                                     | apply time: |
| L4   |                                     |       |
| L5   |                                     | container id: |
| L6   |                                     |       |
| L7   |                                     |       |
| L8   |                                     |       |
| B1   |                                     | paths found: |
| B2   |                                     |       |
| B3   |                                     |       |
| B4   |                                     |       |
| B5   |                                     |       |
| B6   |                                     |       |
| B7   |                                     | gaps: |
| B8   |                                     |       |
| Q1–Q24 | one row each                      |       |
| M1–M9  | one row each                      | M4 compliance: _/5 |
| T1   |                                     |       |
| T2   |                                     |       |
| T3   |                                     | cost: |
```

## What happens with the results

Each mismatch becomes an edit to the chapter or appendix that made the claim, and each match lets an author note's "not yet run" line come out. Appendix A's draft status line changes from "has not yet been applied in a live tenant" to the date of this run. Appendices B and C get the same treatment, recipe by recipe and pattern by pattern.
