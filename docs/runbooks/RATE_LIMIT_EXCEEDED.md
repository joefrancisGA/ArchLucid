> **Scope:** Runbook — 429 Too Many Requests for bulk evidence upload (`evidenceBulkUpload` policy) - tenant identification, limit inspection, and configuration tuning (not code changes).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Runbook: Rate limit exceeded — `evidenceBulkUpload`

**Last reviewed:** 2026-05-18

**Priority:** P2 — Important (support triage for throttled bulk evidence uploads)

## Policy summary

**`POST /v1/architecture/run/{runId}/evidence/bulk`** is protected by the ASP.NET rate-limit policy **`evidenceBulkUpload`** (`[EnableRateLimiting("evidenceBulkUpload")]` on `EvidenceBulkUploadController`).

| Aspect | Behavior |
|--------|----------|
| **Partition key** | Authenticated callers: **`tenant_id`** JWT claim (GUID). Unauthenticated callers: remote IP. |
| **Role segment** | **Admin**, **Operator**, **Reader**, or **anon** — multipliers apply to the base permit count. |
| **Window** | Fixed window; defaults to **1 minute** (`RateLimiting:EvidenceBulkUpload:WindowMinutes`). |
| **Base permit** | **`RateLimiting:EvidenceBulkUpload:PermitLimit`** (default **20** when unset). |
| **Effective permit** | `max(1, round(basePermit × roleMultiplier))` — see **§3**. |
| **Queue** | **`RateLimiting:EvidenceBulkUpload:QueueLimit`** (default **0** — no queued requests after exhaustion). |

**Do not confuse with the per-request file cap:** exceeding **`ArchLucid:EvidenceBulkUploadMaxFiles`** (default **30** files in one multipart batch) returns **400 Bad Request** with problem type **`#evidence-bulk-upload-limit-exceeded`** (`EVIDENCE_BULK_UPLOAD_LIMIT_EXCEEDED`). That is **not** this runbook — it is a validation limit, not the **`evidenceBulkUpload`** rate limiter.

## Symptoms

- HTTP **429 Too Many Requests** on **`POST …/evidence/bulk`**.
- Response body: Problem Details with title **Too many requests** and detail referencing **`Retry-After`**.
- Response headers (when throttled):
  - **`Retry-After`** — seconds until retry is reasonable.
  - **`X-Rate-Limit-Remaining: 0`**
  - **`X-Rate-Limit-Reset`** — Unix epoch seconds for window reset.
  - **`X-Correlation-ID`** — use for log/audit correlation.
- Successful responses on the same route may include **`X-Rate-Limit-Policy: evidenceBulkUpload`**.

## 1. Confirm this is `evidenceBulkUpload` (429), not the file-count limit (400)

| Check | Rate limit (**this runbook**) | File-count validation |
|-------|------------------------------|------------------------|
| **Status** | **429** | **400** |
| **Problem `type`** | `https://tools.ietf.org/html/rfc6585#section-4` | `…#evidence-bulk-upload-limit-exceeded` |
| **Typical cause** | Too many **requests** per tenant/window | Too many **files in one batch** (> `EvidenceBulkUploadMaxFiles`) |
| **Fix levers** | **`RateLimiting:EvidenceBulkUpload:*`**, client backoff | Reduce batch size or raise **`ArchLucid:EvidenceBulkUploadMaxFiles`** (separate change) |

Capture **`X-Correlation-ID`**, **`Retry-After`**, and the response body before changing configuration.

## 2. Identify the affected tenant

Work in this order:

1. **From the caller token (preferred)**  
   Decode the JWT (or inspect the identity provider / SCIM mapping). The partition uses the **`tenant_id`** claim when present and parseable as a GUID.

2. **From API logs / traces**  
   Search by **`X-Correlation-ID`** from the 429 response. Enrichments should include scope context when middleware resolved tenant/workspace/project. See **[TRACE_A_RUN.md](./TRACE_A_RUN.md)** for correlation patterns.

3. **From audit (if uploads succeeded before throttling)**  
   Query **`GET /v1/audit/search`** (or SQL **`dbo.AuditEvents`**) for **`EventType = EvidenceBulkAttached`** on the affected **`runId`**. Scope columns identify tenant/workspace/project for that run.

4. **Shared NAT / missing `tenant_id` claim**  
   If callers share an egress IP and lack **`tenant_id`**, they share one **`ip:{address}`** bucket. Prefer authenticated JWT/API-key principals with a **`tenant_id`** claim so limits partition per tenant. See **`RateLimitingRolePartitionBuilder`** in **`ArchLucid.Api/Startup`**.

Document: tenant GUID (or IP bucket), principal role segment, approximate request rate, and time window of 429s.

## 3. Check current limits

### 3.1 Configuration keys (deployed environment)

Read live settings from the API host (Container Apps / App Service env, Key Vault–backed config, or **`appsettings.{Environment}.json`** — never paste secrets into tickets).

| Key | Default (when unset) | Purpose |
|-----|----------------------|---------|
| **`RateLimiting:EvidenceBulkUpload:PermitLimit`** | **20** | Base requests per window per partition |
| **`RateLimiting:EvidenceBulkUpload:WindowMinutes`** | **1** | Fixed-window length |
| **`RateLimiting:EvidenceBulkUpload:QueueLimit`** | **0** | Post-exhaustion queue depth |
| **`RateLimiting:RoleMultipliers:Admin`** | **3.0** | Admin effective multiplier |
| **`RateLimiting:RoleMultipliers:Operator`** | **1.5** | Operator multiplier |
| **`RateLimiting:RoleMultipliers:Reader`** | **1.0** | Reader / other authenticated roles |
| **`RateLimiting:RoleMultipliers:Anonymous`** | **0.5** | Unauthenticated (clamped **0.25–10** in code) |

Reference: **[CONFIGURATION_REFERENCE.md](../library/CONFIGURATION_REFERENCE.md)** (RateLimiting rows), **`RateLimitingDefaults.EvidenceBulkUploadPermitLimit`**.

### 3.2 Compute effective permit for the caller's role

```
effectivePermit = max(1, round(PermitLimit × roleMultiplier))
```

**Examples (defaults):**

| Role segment | Base 20 | Effective requests / window |
|--------------|---------|----------------------------|
| Reader | 20 × 1.0 | **20** |
| Operator | 20 × 1.5 | **30** |
| Admin | 20 × 3.0 | **60** |
| Anonymous | 20 × 0.5 | **10** |

Each bulk upload request counts as **one** permit regardless of how many files are in the batch (up to **`EvidenceBulkUploadMaxFiles`**).

### 3.3 Validate against observed traffic

- Count **`POST …/evidence/bulk`** **429** vs **200** for the tenant in the log window.
- If 429s appear below the computed effective permit, check for **multiple role segments** (different principals), **clock skew**, or **shared IP partitioning** (§2.4).
- Startup validation rejects invalid **`RateLimiting:EvidenceBulkUpload`** values (`PermitLimit` &lt; 1, non-positive window) — see **`RateLimitingRules`**.

## 4. Operator actions

### 4.1 Immediate — restore the caller

1. Instruct the client to **honor `Retry-After`** (seconds) and use **exponential backoff** on repeated 429s.
2. **Batch fewer HTTP requests**: combine files up to **`EvidenceBulkUploadMaxFiles`** per multipart POST instead of many small posts.
3. If automation hammers the endpoint, add a **client-side throttle** below the effective permit.

### 4.2 Configuration adjustment (when limits are legitimately too low)

**Only after** confirming expected upload volume and storage/ingress capacity:

1. Raise **`RateLimiting:EvidenceBulkUpload:PermitLimit`** and/or **`WindowMinutes`** via environment configuration (e.g. **`RateLimiting__EvidenceBulkUpload__PermitLimit`**).
2. Optionally tune **`RateLimiting:RoleMultipliers:*`** if the bottleneck is role-specific (prefer raising base permit first).
3. **Redeploy or restart** the API so settings reload.
4. Re-test with a single tenant; confirm **200** responses and that **`X-Rate-Limit-Policy`** remains **`evidenceBulkUpload`**.

**Production guardrails:**

- Treat increases as **temporary** unless capacity review approves sustained higher ingress (blob/SQL, APIM, WAF).
- Do **not** disable rate limiting or remove **`[EnableRateLimiting("evidenceBulkUpload")]`** in code as a workaround — this runbook covers **configuration** only.
- For load-test validation of throttling behavior, see **[LOAD_TEST_RATE_LIMITS.md](./LOAD_TEST_RATE_LIMITS.md)** (use a non-production tenant).

### 4.3 Abuse or anomaly (sustained high volume)

If a tenant exceeds limits due to runaway automation or suspected abuse:

1. Keep default limits; work with the tenant to fix client behavior.
2. Escalate per security process (block at APIM/WAF, revoke API keys) rather than lowering shared defaults that affect other tenants.
3. Anomaly detection for **`evidenceBulkUpload`** is tracked separately in product backlog — do not expect automatic tenant quarantine today.

## 5. Security

- Bulk evidence may contain sensitive material; restrict log and audit access to operators with tenant scope.
- Rate limits partition by **`tenant_id`** when authenticated — verify tokens emit that claim in production IdP configuration.
- Configuration changes that raise limits increase **ingress and storage** exposure; apply least-privilege **`ExecuteAuthority`** on automation principals.

## 6. Reliability and cost

- **`QueueLimit: 0`** means excess requests fail fast with **429** rather than piling up — clients must backoff.
- Higher **`PermitLimit`** increases concurrent multipart uploads (default batch cap **100 MB** per request) — watch blob write throughput and SQL audit volume.
- Correlating **`EvidenceBulkAttached`** audit events helps confirm successful uploads vs throttled attempts.

## References

- **`ArchLucid.Api/Controllers/Authority/EvidenceBulkUploadController.cs`** — route and policy name.
- **`ArchLucid.Api/Startup/InfrastructureExtensions.cs`** — **`AddArchLucidRateLimiting`**, **`evidenceBulkUpload`** policy registration, **429** Problem Details shape.
- **`ArchLucid.Api/Startup/RateLimitingRolePartitionBuilder.cs`** — tenant vs IP partitioning and role multipliers.
- **[COMPARISON_REPLAY_RATE_LIMITS.md](./COMPARISON_REPLAY_RATE_LIMITS.md)** — sibling runbook for **`replay`** policy 429s.
- **[COMMON_ERRORS.md](./COMMON_ERRORS.md)** — general **429** / **`Retry-After`** guidance.
- **[API_CONTRACTS.md](../library/API_CONTRACTS.md)** — authentication and problem response conventions.
