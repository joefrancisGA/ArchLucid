> **Scope:** Local development — outbound transactional email (invites, OTP, trial lifecycle).

# Local development email

## Recommended: Azure Communication Services (ACS) Email

Matches hosted staging/production (`Email:Provider=AzureCommunicationServices`). Pay-as-you-go — about **$0.00025 per invite** (100 invites ≈ **3¢**).

### Production sender: `noreply@archlucid.net`

Custom domain mail requires **DNS verification** at your `archlucid.net` host (GoDaddy today). Owner copy of required records: **`.local/owner/acs-archlucid-net-dns.md`**. After publishing DNS:

```powershell
.\scripts\dev\verify-acs-archlucid-net-dns.ps1
```

That script verifies the domain, links it to the dev Communication Service, and refreshes user secrets.

### Local dev ACS (managed domain fallback)

Use an **Azure managed domain** first (no DNS purchase; fine for dev invites).

1. Sign in to [Azure Portal](https://portal.azure.com).
2. **Create a resource** → search **Email Communication Services** → create (pick a region, e.g. **United States**).
3. Open the new Email Communication Service → **Provision domains** → **Add domain** → **Azure domain** → create.
4. Note the managed sender address (e.g. `DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net`).
5. **Create a resource** → **Communication Services** (same resource group/region).
6. Open the Communication Services resource → **Email** → **Connect domain** → select your Email Communication Service and the Azure managed domain.
7. On the Communication Services **Overview**, copy **Endpoint** (e.g. `https://your-name.communication.azure.com`).

**Auth for local `dotnet run`:** the API uses `DefaultAzureCredential` → run **`az login`** with the same tenant. If sends fail with **403**, grant your user **Contributor** on the **Communication Services** resource (Access control → Add role assignment).

**Rate limits (Azure managed domain):** about **5 emails/minute** and **10/hour** — enough for local invite testing.

### 2. Wire ArchLucid.Api user secrets

From the repo root:

```powershell
az login

.\scripts\dev\configure-local-email.ps1 -UseAcs `
  -AcsEndpoint 'https://YOUR-COMMUNICATION-SERVICE.communication.azure.com/' `
  -FromAddress 'DoNotReply@YOUR-MANAGED-DOMAIN.azurecomm.net'
```

Restart **ArchLucid.Api**, then **Revoke** any stale pending invite and **send a new one** (duplicate pending rows do not re-mail).

### 3. Verify diagnostics

**Settings → Identity providers** → setup checklist **Invite email base URL** should be green (`Email:OperatorBaseUrl` defaults to `http://localhost:3000` in the script).

### Terraform (optional — custom domain for archlucid.net)

When you want production parity with `noreply@archlucid.net`, use `infra/terraform-container-apps` with `enable_communication_email_account = true`. See [`infra/terraform-container-apps/README.md`](../../infra/terraform-container-apps/README.md) § Azure Communication Services Email. Outputs:

- `communication_email_endpoint` → `Email:AzureCommunicationServicesEndpoint`
- `communication_email_from_address` → `Email:FromAddress`

---

## Alternative: local SMTP capture (smtp4dev)

No real inbox delivery — mail appears in a browser UI.

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d smtp4dev
.\scripts\dev\configure-local-email.ps1 -UseLocalSmtp4Dev
```

Open **http://localhost:8025** after sending an invite.

---

## Alternative: SMTP relay (Gmail, Outlook, SendGrid)

```powershell
.\scripts\dev\configure-local-email.ps1 `
  -SmtpHost smtp.gmail.com `
  -SmtpPort 587 `
  -SmtpUser 'you@gmail.com' `
  -SmtpPassword 'your-google-app-password' `
  -FromAddress 'you@gmail.com'
```

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| UI says invite sent, inbox empty | API not restarted; duplicate pending invite (revoke first); spam folder. |
| API log: `Workspace invitation email send failed` + 403 | `az login` missing or no **Contributor** on Communication Services. |
| API log: domain not verified | Custom domain DNS not published; use **Azure managed domain** for dev. |
| Throttling / HTTP 429 | Azure managed domain hourly cap (~10/h); wait or request quota increase. |
| Accept link wrong host | Set `Email:OperatorBaseUrl` to `http://localhost:3000` (included in configure script). |

**Diagnostics:** `GET /v1/admin/auth/configuration-diagnostics` → `operatorBaseUrlConfigured`.

## Related

- [`EMAIL_NOTIFICATIONS.md`](../library/EMAIL_NOTIFICATIONS.md) — provider matrix and ACS production posture.
- [`LIVE_E2E_JWT_SETUP.md`](../library/LIVE_E2E_JWT_SETUP.md) — beta readiness diagnostics for invites.
- [ACS email pricing](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email-pricing) — pay-as-you-go rates.
