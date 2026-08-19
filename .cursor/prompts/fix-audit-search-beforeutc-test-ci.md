# Fix: AuditControllerSearchTests.SearchAudit_WithBeforeUtc_PassesFilterToRepo (HTTP 400)

## Symptom

`SearchAudit_WithBeforeUtc_PassesFilterToRepo` fails immediately in CI:

```
HTTP 400 Bad Request
detail: "beforeUtc requires beforeEventId for stable keyset pagination."
instance: /v1/audit/search
```

## Root cause

Batch 1 (`5490aa952`) added symmetric keyset pagination validation in
`ArchLucid.Api/Controllers/Admin/AuditController.cs`:

- `beforeEventId` without `beforeUtc` (and no opaque cursor) → 400
- `beforeUtc` without `beforeEventId` (and no opaque cursor) → 400

The test at line ~72 in `ArchLucid.Api.Tests/AuditControllerSearchTests.cs` still calls:

```http
GET /v1/audit/search?beforeUtc=2026-01-01T00:00:00.0000000Z
```

That is intentionally rejected by the API. The sibling test
`SearchAudit_WithBeforeEventId_without_BeforeUtc_Returns400` already covers the inverse direction;
there is no matching test for `beforeUtc`-only rejection, and the success-path test was never updated.

**This is a test drift bug, not a product regression.**

## Fix

**File:** `ArchLucid.Api.Tests/AuditControllerSearchTests.cs`

### 1. Add rejection test (mirror existing pattern)

Add `SearchAudit_WithBeforeUtc_without_BeforeEventId_Returns400` next to the existing
`SearchAudit_WithBeforeEventId_without_BeforeUtc_Returns400` test:

```csharp
[SkippableFact]
public async Task SearchAudit_WithBeforeUtc_without_BeforeEventId_Returns400()
{
    await using AuditControllerSearchApiFactory factory = new();
    HttpClient client = factory.CreateClient();

    HttpResponseMessage response =
        await client.GetAsync("/v1/audit/search?beforeUtc=2026-01-01T00:00:00.0000000Z");

    response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
}
```

### 2. Update the success-path filter test

Change `SearchAudit_WithBeforeUtc_PassesFilterToRepo` to pass **both** query params and verify both
reach `AuditEventFilter`:

```csharp
Guid beforeEventId = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890");

HttpResponseMessage response = await client.GetAsync(
    $"/v1/audit/search?beforeUtc=2026-01-01T00:00:00.0000000Z&beforeEventId={beforeEventId:D}");

// Verify filter includes both BeforeUtc and BeforeEventId
It.Is<AuditEventFilter>(f =>
    f.BeforeUtc.HasValue
    && f.BeforeUtc.Value.Kind == DateTimeKind.Utc
    && f.BeforeUtc.Value.Year == 2026
    && f.BeforeUtc.Value.Month == 1
    && f.BeforeUtc.Value.Day == 1
    && f.BeforeEventId == beforeEventId)
```

Optionally rename the method to `SearchAudit_WithBeforeUtcAndBeforeEventId_PassesFilterToRepo` for
clarity (not required if the verify block is updated).

## Acceptance criteria

1. Changes are limited to `AuditControllerSearchTests.cs` — do not weaken API validation.
2. Both symmetric 400 tests exist (`beforeEventId`-only and `beforeUtc`-only).
3. Success-path test passes both params and verifies repo receives them.
4. `ArchLucid.Backend.slnf` compiles.

## Verification

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj `
  --filter "FullyQualifiedName~AuditControllerSearchTests"
```
