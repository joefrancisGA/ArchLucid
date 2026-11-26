using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Security;

// A catalog is accepted only from administrator-provisioned, digest-pinned bytes.
// The pin is the independent verification boundary, not a claim in the JSON.
internal sealed class ProvisionedRuntimeAdvisoryCatalogSource(
    IConfiguration config, IRuntimeTelemetryReadAuthority authority, TimeProvider clock)
    : IVerifiedRuntimeAdvisoryCatalogSource
{
    public async Task<VerifiedRuntimeAdvisoryCatalog?> ReadAsync(RuntimeObservationRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (!RuntimeTelemetryProvisioning.Enabled(config) || !await authority.CanReadAsync(request, ct))
            return null;
        var section = RuntimeTelemetryProvisioning.Scope(config, request).GetSection("AdvisoryCatalog");
        string? encoded = section["PayloadBase64"];
        string? digest = section["VerifiedSha256"];
        if (encoded is not { Length: > 0 and <= 1398104 } ||
            digest is not { Length: 64 } || !digest.All(Uri.IsHexDigit)) return null;
        try
        {
            byte[] bytes = Convert.FromBase64String(encoded);
            if (bytes.Length is <= 0 or > 1048576) return null;
            byte[] hash = SHA256.HashData(bytes);
            if (!CryptographicOperations.FixedTimeEquals(hash, Convert.FromHexString(digest))) return null;
            var catalog = JsonSerializer.Deserialize<VerifiedRuntimeAdvisoryCatalog>(bytes);
            var now = clock.GetUtcNow();
            if (catalog is null || catalog.VerifiedAt > now || catalog.ValidUntil <= now ||
                catalog.ValidUntil <= catalog.VerifiedAt || catalog.Entries is not { Count: <= 1000 } ||
                catalog.Entries.Any(e => e is null || string.IsNullOrWhiteSpace(e.AdvisoryId) ||
                    string.IsNullOrWhiteSpace(e.EvidenceId) || e.RequiredPrerequisites is null ||
                    e.VerifiedAt > catalog.VerifiedAt || e.ValidUntil <= e.VerifiedAt))
                return null;
            if (!await authority.CanReadAsync(request, ct) ||
                !string.Equals(section["VerifiedSha256"], digest, StringComparison.Ordinal) ||
                !string.Equals(section["PayloadBase64"], encoded, StringComparison.Ordinal) ||
                catalog.ValidUntil <= clock.GetUtcNow()) return null;
            ct.ThrowIfCancellationRequested();
            return catalog with { EvidenceId = "runtime-catalog:sha256:" + Convert.ToHexString(hash) };
        }
        catch (Exception ex) when (ex is FormatException or JsonException or CryptographicException)
        { return null; }
    }
}
