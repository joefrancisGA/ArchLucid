# Import Existing Architecture into ArchLucid

**Pattern:** turn **infrastructure that already exists** (Terraform state, Azure Resource Manager (ARM) template, or a **CSV business brief**) into a **V1** `POST /v1/architecture/request` call. No new C# in your fork is required: the product already ingests `infrastructureDeclarations` on the run request; the **JSON** form maps to `ResourceDeclarationDocument` in the context-ingestion layer (see [CONTEXT_INGESTION.md](../../../docs/library/CONTEXT_INGESTION.md) § `json` / `simple-terraform`). **Alternatively**, pass **`format` = `terraform-show-json`** (full `terraform show -json`) — see **`docs/integrations/TERRAFORM_STATE_IMPORT.md`**.

**Server-side:** [`ArchLucid.ContextIngestion/Infrastructure/TerraformShowJsonInfrastructureDeclarationParser.cs`](../../../ArchLucid.ContextIngestion/Infrastructure/TerraformShowJsonInfrastructureDeclarationParser.cs) parses **full** `terraform show -json` when **`format`** is **`terraform-show-json`** (public **`POST`** validator permits this format — **`ArchLucid.Api/Validators/InfrastructureDeclarationRequestValidator.cs`**).

**Integration events (outbound webhooks, CloudEvent types):** Canonical type list in [`schemas/integration-events/catalog.json`](../../../schemas/integration-events/catalog.json); narrative and HMAC patterns in [`docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md`](../../../docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md).

---

## Terraform (PowerShell)

**Script:** [`Import-TerraformStateToRequest.ps1`](./Import-TerraformStateToRequest.ps1) — runs `terraform show -json` in the current directory, projects **root** `values.root_module.resources` into `ResourceDeclarationItem` rows, serializes a **ResourceDeclarationDocument** JSON string, and builds the full `ArchitectureRequest` JSON. If **`ARCHLUCID_API_URL`** and **`ARCHLUCID_API_KEY`** are set, it **POSTs** the body.

**Prereqs:** Terraform on `PATH`, PowerShell 7+, a directory where `terraform init` and `terraform show` succeed.

**Example (PowerShell, same env vars as everywhere else in these templates):**

```powershell
cd C:\IaC\myStack
$env:ARCHLUCID_API_URL = "https://api.contoso.com"
$env:ARCHLUCID_API_KEY = "paste-key-from-vault"   # never print or log
./Import-TerraformStateToRequest.ps1 -SystemName "OrdersApi" -Description "Import current Terraform state for the Orders service boundary before refactor."
```

The script only walks **one** `root_module` in this template; nested `child_modules` in state are a straightforward extension: mirror the **recursive** visit in the parser class above (optional exercise for your fork).

---

## ARM template (PowerShell)

**Script:** [`Import-ArmTemplateToRequest.ps1`](./Import-ArmTemplateToRequest.ps1) — `Get-Content` a JSON file with a top-level `resources` array, maps `type` + `name` per resource into the same **ResourceDeclarationDocument** shape, then POSTs when the env vars are set.

**Example:**

```powershell
$env:ARCHLUCID_API_URL = "https://api.contoso.com"
$env:ARCHLUCID_API_KEY = "paste-key-from-vault"
./Import-ArmTemplateToRequest.ps1 -TemplatePath "C:\arm\export.json" -SystemName "SharedHub"
```

---

## CSV (no Terraform / no ARM)

**File:** [`brief-template.csv`](./brief-template.csv) — one line per system with **systemName**, **environment**, **description** (≥ 10 characters), **cloudProvider** (use **`Azure`** for the shipped V1 `CloudProvider` model), and optional **constraint** columns.

**Script:** [`Request-FromBriefCsv.ps1`](./Request-FromBriefCsv.ps1) — imports the first row, emits JSON, and POSTs when the env vars are set.

```powershell
$env:ARCHLUCID_API_URL = "https://api.contoso.com"
$env:ARCHLUCID_API_KEY = "paste-key-from-vault"
./Request-FromBriefCsv.ps1
```

No infrastructure declarations are attached; this is a **narrative-only** request suitable when governance starts from documents.

---

## Configuration (shared)

| Name | Required for POST | Description |
|------|-------------------|-------------|
| `ARCHLUCID_API_URL` | Yes (scripts that auto-post) | HTTPS base without trailing `/` |
| `ARCHLUCID_API_KEY` | Yes (scripts that auto-post) | `X-Api-Key` |
| (Terraform / ARM) | N/A on server | The body includes `infrastructureDeclarations[0].content` as a **string** containing the inner JSON (PowerShell enforces that) |

**Execute policy:** `POST /v1/architecture/request` requires **Execute**-class policy for the caller. Use a service account key created for **automation** with least scope.

---

## Verify it works

1. **Health (no key):**  
   `curl -sS -o /dev/null -w "%{http_code}\n" "$ARCHLUCID_API_URL/health"`
2. **V1 list run summaries (proves `X-Api-Key` and Read path):**  
   `curl -sS -H "X-Api-Key: $ARCHLUCID_API_KEY" "$ARCHLUCID_API_URL/v1/architecture/runs?limit=1" | head -c 200; echo`
3. **After a create:**  
   `curl -sS -H "X-Api-Key: $ARCHLUCID_API_KEY" "$ARCHLUCID_API_URL/v1/architecture/run/<runIdFromResponse>" | head -c 500; echo`

A **201** (or idempotent **200** with the right headers) on create and a **200** on `GET /v1/architecture/run/…` confirm the pipeline.

**Notes**

- The inner JSON in `infrastructureDeclarations[].content` must be **valid** `ResourceDeclarationDocument` JSON: top-level `resources` array, each with **type**, **name**, and optional `properties` map.  
- **Character limit:** the validator allows up to **2 000 000** characters per `content` field — large states may need **pruning** or top-N resources.

---

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| **400** on create | `description` length, `requestId` uniqueness, `cloudProvider` = `Azure` in V1 |
| **400** on `infrastructureDeclarations` | **`format`** must be **`json`**, **`simple-terraform`**, or **`terraform-show-json`** (case-insensitive); inner JSON expectations depend on **`format`** (see **`CONTEXT_INGESTION.md`**) |
| **403** on POST | **Execute** policy missing for this key (Reader-only keys can list runs but not create) |

**Correlation:** record `requestId` from the create response; it appears in `GET /v1/architecture/run/{runId}.run` as part of the run metadata. Match `runId` to your CI logs and Application Insights.

---

## How this maps to the Terraform parser in code

- **Direct `terraform show -json`:** set `infrastructureDeclarations[].format` to **`terraform-show-json`** and **`content`** to raw state JSON (**`POST /v1/architecture/request`**); see **`docs/integrations/TERRAFORM_STATE_IMPORT.md`**. This recipe converts to **`json`** for callers that prefer a smaller DTO projection.
