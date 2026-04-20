# Azure Front Door (Standard) + WAF

Optional Terraform root for a **public edge** in front of your API or **API Management** hostname. Defaults **`enable_front_door_waf = false`** so laptop-only development is unchanged.

## What customers get

- **Managed WAF** (Microsoft Default Rule Set 2.1 + Bot Manager) in **Prevention** mode.
- **HTTPS** at the edge with redirect; origin traffic uses the hostname you configure.
- **Primary origin** — point `backend_hostname` at **APIM** (`*.azure-api.net`) or a direct **App Service** hostname.
- **Optional secondary origin** — set `secondary_backend_hostname` (and optional `secondary_origin_host_header`) for a passive standby in another region; Front Door uses priority/weight (1/1000 vs 2/500) and health probes for failover.

## Order of operations

1. Deploy the **API** (or **APIM** from `../terraform/`).
2. Set `backend_hostname` to that public hostname.
3. Apply this stack with **`enable_front_door_waf = true`**.
4. Point **DNS** (CNAME or Azure DNS alias) at the output **`front_door_endpoint_hostname`** when you add a custom domain (optional; default `*.azurefd.net` works for testing).

## Health probe

The origin group uses **HTTPS HEAD** against **`front_door_health_probe_path`** (default **`/health/ready`**) so Front Door aligns with ArchLucid.Api readiness when the origin is the API. For **Next.js UI-only** origins with no readiness route, set **`front_door_health_probe_path = "/"`** in `terraform.tfvars`. For APIM, use a path your gateway returns **2xx** for (often **`/status-0123456789abcdef`** or your API health route).

## Marketing redirects

When **`enable_front_door_waf`** and **`enable_pricing_json_to_pricing_page_redirect`** are true, a Front Door **rule set** is attached to the main route that issues a **301 Moved** from **`/pricing.json`** to **`/pricing`** so browsers land on the Next.js marketing page instead of the static JSON document. Disable the redirect by setting **`enable_pricing_json_to_pricing_page_redirect = false`** if your origin should serve JSON at that path unchanged.

**`marketing_custom_domain_hostname`** is a passthrough output for operators (default empty). Binding a custom domain + managed certificate in Partner Center / DNS is environment-specific and not fully automated in this root.

## Variables

See `variables.tf` and `terraform.tfvars.example`.

## Correlation IDs

**X-Correlation-ID** is forwarded through Front Door by default. Keep sending it from clients so support can tie **WAF logs**, **Front Door metrics**, and **ArchLucid.Api** logs together.
