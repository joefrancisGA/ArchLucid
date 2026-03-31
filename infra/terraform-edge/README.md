# Azure Front Door (Standard) + WAF

Optional Terraform root for a **public edge** in front of your API or **API Management** hostname. Defaults **`enable_front_door_waf = false`** so laptop-only development is unchanged.

## What customers get

- **Managed WAF** (Microsoft Default Rule Set 2.1 + Bot Manager) in **Prevention** mode.
- **HTTPS** at the edge with redirect; origin traffic uses the hostname you configure.
- **Single origin** — point `backend_hostname` at **APIM** (`*.azure-api.net`) or a direct **App Service** hostname.

## Order of operations

1. Deploy the **API** (or **APIM** from `../terraform/`).
2. Set `backend_hostname` to that public hostname.
3. Apply this stack with **`enable_front_door_waf = true`**.
4. Point **DNS** (CNAME or Azure DNS alias) at the output **`front_door_endpoint_hostname`** when you add a custom domain (optional; default `*.azurefd.net` works for testing).

## Health probe

The origin group uses **HTTPS HEAD /**. For APIM, `/` may not return 200; if probes fail, change the probe path in `frontdoor.tf` (e.g. to a path your gateway serves reliably) or tune in Azure Portal and backport to Terraform.

## Variables

See `variables.tf` and `terraform.tfvars.example`.

## Correlation IDs

**X-Correlation-ID** is forwarded through Front Door by default. Keep sending it from clients so support can tie **WAF logs**, **Front Door metrics**, and **ArchiForge.Api** logs together.
