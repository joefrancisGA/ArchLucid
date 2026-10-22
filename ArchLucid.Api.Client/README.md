# ArchLucid.Api.Client

Versioned .NET package containing an **NSwag-generated** `HttpClient`-based client for **ArchLucid API v1**.

## Source contract

Generation uses the committed OpenAPI document:

`ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`

That file is kept in sync with `GET /openapi/v1.json` by `OpenApiContractSnapshotTests` in the main repository.

## Usage

```csharp
using System.Net.Http;
using ArchLucid.Api.Client.Generated;

HttpClient http = new HttpClient { BaseAddress = new Uri("https://your-archlucid-api/") };
ArchLucidApiClient client = new ArchLucidApiClient(http);
// Call client.*Async methods; pass api-version query where required.
```

Configure authentication on `HttpClient` (for example default `Authorization` headers) to match your deployment’s `ArchLucidAuth` mode.

## Package versioning

The NuGet **package version** (`ArchLucidApiClientPackageVersion` in `Directory.Build.props`) is the shipping line for the SDK. Bump it when you publish a new client drop; it is intentionally **independent** of the API’s `info.version` field inside the OpenAPI file.

## Regenerating locally

`Generated/ArchLucidApiClient.g.cs` is **gitignored**. Every `dotnet build` / `dotnet pack` of this project runs NSwag against the OpenAPI snapshot before compile.

After API contract changes:

1. Update the snapshot (canonical OpenAPI): set **`ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1`** and run **`OpenApiContractSnapshotTests`** (see repo **`OPENAPI_CONTRACT_DRIFT.md`**).
2. Rebuild this project: **`dotnet build ArchLucid.Api.Client.csproj`** — NSwag writes **`Generated/ArchLucidApiClient.g.cs`** from **`ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`**.
3. Refresh **`archlucid-ui`** types: from **`archlucid-ui/`**, **`npm run generate:api-types`** (writes **`src/lib/api-types.generated.ts`** — still committed).

Commit the snapshot and regenerated TS types in the same PR as the API change when possible. Do **not** commit the NSwag `.g.cs` output.

### Emergency offline skip

If NSwag cannot run and a previously generated `.g.cs` is already on disk, set **`ARCHLUCID_SKIP_OPENAPI_CLIENT_REGEN=1`** or **`ArchLucidSkipNSwag=true`**. Skip is ignored when the file is missing so a fresh clone cannot silently compile without generation.
