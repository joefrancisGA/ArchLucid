> **Scope:** Operator / founder runbook — dual Container App hostname cutover (marketing apex vs operator `app.`), no Front Door. Not a buyer document.

# Marketing / operator host cutover (TB-2016)

## Goal

Cut over production (or staging) to:

| Host | Container App | Same image |
|------|---------------|------------|
| `archlucid.net` / `www` | `archlucid-ui-marketing` | `archlucid-ui` digest |
| `app.archlucid.net` | `archlucid-ui` | same digest |
| API host | `archlucid-api` | unchanged |

Code/middleware/CTAs ship in the UI image. This runbook covers **ops** that must run against Azure / DNS / GitHub.

## Prerequisites

1. UI image that includes host-gate + `site-urls` (TB-2016–TB-2019) is built and ready to deploy (or already on both apps).
2. `terraform apply` in `infra/terraform-container-apps` with `enable_marketing_ui_container_app = true` so `archlucid-ui-marketing` exists.
3. `az login` + subscription selected; `gh` authenticated for GitHub secret step.
4. You can create DNS TXT/CNAME (or ALIAS) at the registrar — the script only **prints** records.

## Script (preferred)

Dry-run (default — prints DNS + planned `az` / `gh` commands):

```powershell
.\scripts\ops\Invoke-MarketingOperatorHostCutover.ps1 `
  -ResourceGroup 'rg-ArchLucid-staging' `
  -EnvironmentName '<cae-name>' `
  -PublicSiteUrl 'https://archlucid.net' `
  -AppSiteUrl 'https://app.archlucid.net' `
  -ApiBaseUrl 'https://<api-host>' `
  -WwwHostname 'www.archlucid.net'
```

Recommended order:

| Step | Command / action | When |
|------|------------------|------|
| 1 | Terraform apply (marketing CA) | Before DNS |
| 2 | Script dry-run → create DNS from **DnsGuide** | After CA exists |
| 3 | Wait DNS propagation | — |
| 4 | `-Phase SetUiEnv,SetApiCors,SetGithubSecret -Apply` | Can run before or after image cutover |
| 5 | Deploy UI image to **both** apps (CD with `CONTAINER_APP_MARKETING_UI_NAME`) | When build is ready |
| 6 | `-Phase BindHostnames -Apply` (or `-BindHostnamesNow -Apply`) | After DNS resolves |
| 7 | `-Phase Verify` | Anytime |

Full apply including hostname bind (only after DNS is live):

```powershell
.\scripts\ops\Invoke-MarketingOperatorHostCutover.ps1 `
  -ResourceGroup 'rg-ArchLucid-staging' `
  -EnvironmentName '<cae-name>' `
  -PublicSiteUrl 'https://archlucid.net' `
  -AppSiteUrl 'https://app.archlucid.net' `
  -ApiBaseUrl 'https://<api-host>' `
  -WwwHostname 'www.archlucid.net' `
  -BindHostnamesNow `
  -Apply
```

## What the script sets

**Both UI apps**

- `ARCHLUCID_PUBLIC_SITE_URL` / `ARCHLUCID_APP_SITE_URL`
- `ARCHLUCID_API_BASE_URL`
- `NEXT_PUBLIC_ARCHLUCID_SITE_URL` / `NEXT_PUBLIC_ARCHLUCID_APP_SITE_URL` (metadata / client fallbacks)
- `ARCHLUCID_UI_ROLE` = `marketing` | `operator`

**API**

- `Cors__AllowedOrigins__0…` = public (+ www if provided) + app origin

**GitHub Environment secret**

- `CONTAINER_APP_MARKETING_UI_NAME` = `archlucid-ui-marketing` (so CD rolls both apps)

## What you still do by hand

- Registrar DNS (TXT `asuid.*`, CNAME/ALIAS)
- Apex CNAME limitations (ALIAS/ANAME or www-primary + apex redirect)
- Confirm smoke URLs after bind + deploy (script prints `curl -sI` checks)

## Bootstrap helper

`scripts/ci/bootstrap-github-cd-environments.ps1` accepts `-ContainerAppMarketingUiName` so new environments get the marketing secret with the rest of CD secrets.

## Related

- [`PUBLIC_MARKETING_SITE_TOPOLOGY.md`](../library/PUBLIC_MARKETING_SITE_TOPOLOGY.md) — Option D
- [`MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md`](../library/MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md)
- `infra/terraform-container-apps/README.md` — custom domain CLI notes
