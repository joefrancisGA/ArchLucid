# Azure Front Door (Standard) + WAF

Optional Terraform root for a **public edge** in front of your API or **API Management** hostname. Defaults **`enable_front_door_waf = false`** so laptop-only development is unchanged.

## What customers get

- **WAF policy** in **Prevention** mode with **custom rules only** on **Standard** SKU (**TB-903** — managed rule sets require Premium and are not applied here).
- **HTTP/3** at the edge — Azure Front Door **Standard/Premium** enables HTTP/3 by **platform default**. The `azurerm` provider exposes **no** `http3` / `enable_http3` flag on `azurerm_cdn_frontdoor_profile`; confirm in the Azure portal / metrics if a subscription policy disables it. Do not invent a Terraform attribute.
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

## Origin response timeout (TB-2073)

This Terraform root does **not** set `origin_response_timeout` on Front Door origin groups. Azure Front Door **Standard** uses the platform default (**60s** origin response timeout unless overridden in the portal or a future IaC change). That ceiling sits **below** Real-mode agent execute (`PerHandlerTimeoutSeconds` up to **900s**) and above the Next.js UI proxy/RSC caps documented in [`docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md`](../../docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md) §9. Tier C work must use **202 + operation poll**, not a single sync HTTP hold through Front Door.

## CDN cache behavior (TB-868)

Front Door **Standard** honors origin **`Cache-Control`** headers. The UI origin (`archlucid-ui/next.config.ts`, production) sends:

- **`no-cache, no-store, max-age=0, must-revalidate`** on HTML / application shell routes (`/:path*`)
- **`public, max-age=31536000, immutable`** on fingerprinted `/_next/static/*` and `/images/*`

**Routine deploys do not require a Front Door purge.** Purge only during incident response when edge cache ignored origin policy — and purge **shell paths** (e.g. `/welcome`, `/`), not `/_next/static/*`.

Post-deploy CD smoke fetches `/welcome` with cache-bypass request headers and asserts the `archlucid:build-commit` meta tag matches `BUILD_ID`. See [`docs/operations/FRONTEND_SHELL_CACHE.md`](../../docs/operations/FRONTEND_SHELL_CACHE.md).
