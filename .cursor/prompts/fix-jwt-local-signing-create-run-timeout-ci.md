# Fix: JwtLocalSigningIntegrationTests Admin create-run CI timeout

## Symptom

`Admin_jwt_passes_execute_authority_role_gate_for_create_run` fails in CI after ~1m 40s:

```
System.Threading.Tasks.TaskCanceledException : The operation was canceled.
---- System.Net.Http.HttpRequestException : Error while copying content to a stream.
-------- System.IO.IOException : The client aborted the request.
```

Stack trace points to `JwtLocalSigningIntegrationTests.cs` line ~149 (`await client.SendAsync(request)`).

The sibling test `Reader_jwt_forbidden_on_execute_authority_create_run` does **not** fail — it receives **403**
at the `ExecuteAuthority` policy layer before orchestration runs.

## Root cause

This is a **test-harness timeout mismatch**, not an RBAC regression.

| Layer | Behavior |
|-------|----------|
| **Reader Admin negative** | `ExecuteAuthority` forbids Reader → **403** quickly (no create-run orchestration). |
| **Admin positive** | JWT passes `ExecuteAuthority` → `POST /v1/architecture/request` runs full `CreateRunAsync`, including **inline** authority pipeline on the InMemory host (`DisabledAsyncAuthorityPipelineModeResolver`). |
| **`JwtLocalSigningWebAppFactory`** | `StorageProvider=InMemory`, `AgentExecution:Mode=Simulator` — correct for JWT mint/validation tests. |
| **`HttpClient.Timeout`** | **Not overridden** — defaults to **100 seconds** (`WebApplicationFactory` base). |
| **Pipeline budget** | `AuthorityPipelineOptions.PipelineTimeout` defaults to **5 minutes**; create-run does not return response headers until orchestration completes (see `RunsController.CreateRun`). |

On a loaded CI runner, inline create-run + authority pipeline can exceed **100s**. `HttpClient` cancels the
request while buffering the response body (`LoadIntoBufferAsync`), producing `TaskCanceledException` /
"client aborted the request".

**Contrast:** `ArchLucidApiFactory` and `GreenfieldSqlApiFactory` override `ConfigureClient` with multi-minute
timeouts (65 min and 15 min respectively). `JwtLocalSigningWebAppFactory` extends `WebApplicationFactory<Program>`
directly and omits that override.

The test comment already states intent: *"does not assert 201 — orchestration side effects only"* — it only
needs proof that Admin is **not** `401`/`403`. It should not depend on the default 100s client ceiling.

## Fix

**Primary files:**

- `ArchLucid.Api.Tests/JwtLocalSigningWebAppFactory.cs`
- `ArchLucid.Api.Tests/JwtLocalSigningIntegrationTests.cs`

### 1. Align `HttpClient.Timeout` on the JWT factory (required)

Override `ConfigureClient` in `JwtLocalSigningWebAppFactory`:

```csharp
/// <summary>
///     Create-run on this InMemory host runs inline authority pipeline (default 5 min). Default HttpClient.Timeout
///     (100s) is too low for Admin ExecuteAuthority positive probes on cold CI.
/// </summary>
internal static readonly TimeSpan JwtLocalSigningIntegrationHttpTimeout = TimeSpan.FromMinutes(10);

protected override void ConfigureClient(HttpClient client)
{
    base.ConfigureClient(client);
    client.Timeout = JwtLocalSigningIntegrationHttpTimeout;
}
```

**10 minutes** = default `PipelineTimeout` (5 min) + headroom for host boot and transient CI slowdown.
Do **not** copy the 65-minute SQL idempotency lock budget — this factory is InMemory-only.

### 2. Stop buffering the create-run response body in the Admin role-gate test (required)

The Admin fact only asserts status codes. Use header-only completion so a slow body serialize does not
trip `LoadIntoBufferAsync` independently of timeout alignment:

```csharp
HttpResponseMessage response = await client.SendAsync(
    request,
    HttpCompletionOption.ResponseHeadersRead);

response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
// Do not ReadAsStringAsync — role-gate only; dispose without buffering body.
```

Apply the same `ResponseHeadersRead` pattern to `Reader_jwt_forbidden_on_execute_authority_create_run` for
symmetry (optional but keeps both facts consistent).

### 3. Optional explicit pipeline cap in factory settings

In `BuildHostConfigurationOverrides`, add for clarity (matches default today):

```csharp
["AuthorityPipeline:PipelineTimeout"] = "00:05:00",
```

Only if you need faster failure on true pipeline hangs; not a substitute for step 1.

## Alternatives considered (do not implement unless steps 1–2 fail)

| Alternative | Why rejected |
|-------------|--------------|
| Point Admin positive at a different `ExecuteAuthority` route (e.g. finding mute) | Changes coverage — this fact specifically locks JWT + `POST /v1/architecture/request`. |
| Copy 65-minute SQL timeout from `ArchLucidApiFactory` | Over-broad for InMemory JWT tests; masks real hangs. |
| Greenfield SQL warmup / skip wrappers | Wrong factory — `JwtLocalSigningWebAppFactory` is InMemory, not `GreenfieldSqlApiFactory`. |
| Product change to return 201 before pipeline completes | Out of scope; test harness fix only. |

## Acceptance criteria

1. `JwtLocalSigningWebAppFactory.ConfigureClient` sets `HttpClient.Timeout` ≥ 10 minutes before any test HTTP call.
2. `Admin_jwt_passes_execute_authority_role_gate_for_create_run` uses `HttpCompletionOption.ResponseHeadersRead`
   and does not read the full response body.
3. `Reader_jwt_forbidden_on_execute_authority_create_run` unchanged in assertion semantics (still expects **403**).
4. No product/API/auth changes — test factory + HTTP client behavior only.
5. `ArchLucid.Backend.slnf` compile check passes.

## Verification (read-only — do not run full CI locally unless asked)

1. Grep `JwtLocalSigningWebAppFactory` for `ConfigureClient` — must set timeout.
2. Grep `Admin_jwt_passes_execute_authority_role_gate_for_create_run` for `ResponseHeadersRead`.
3. Confirm `JwtLocalSigningWebAppFactory` still sets `ArchLucid:StorageProvider=InMemory` (no accidental SQL coupling).
4. Confirm `AuthorizationBoundaryTests.Reader_key_cannot_POST_architecture_request_returns_403` (ApiKey factory) is
   unchanged — separate fixture.

## Related

- `ArchLucid.Api.Tests/ArchLucidApiFactory.cs` — `ConfigureClient` → 65 min (SQL create-run / applock chain)
- `ArchLucid.Api.Tests/ArchitectureRequestConcurrencyTestSupport.cs` — documents default 100s `HttpClient.Timeout` hazard
- `ArchLucid.Core/Authority/AuthorityPipelineOptions.cs` — default `PipelineTimeout` = 5 minutes
- `docs/security/AUTHORIZATION_BOUNDARY_TEST_INVENTORY.md` — ApiKey Reader 403 on create-run (no Admin positive there)
