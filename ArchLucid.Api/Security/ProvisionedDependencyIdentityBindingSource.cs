using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Security;

// Independent administrator-provisioned digest attests the exact identity evidence bytes.
// This does not discover live Azure identity grants or establish trust in an arbitrary caller.
internal sealed class ProvisionedDependencyIdentityBindingSource(IConfiguration config,
    IRuntimeTelemetryReadAuthority authority, TimeProvider clock) : IVerifiedDependencyIdentityBindingSource
{
    public async Task<IReadOnlyList<VerifiedDependencyIdentityBinding>?> ReadAsync(
        RuntimeObservationRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!RuntimeTelemetryProvisioning.Enabled(config) || !await authority.CanReadAsync(request, ct))
            return null;
        var section = RuntimeTelemetryProvisioning.Scope(config, request).GetSection("IdentityBindings");
        string? encoded = section["PayloadBase64"];
        string? digest = section["VerifiedSha256"];

        if (encoded is not { Length: > 0 and <= 1398104 } ||
            digest is not { Length: 64 } || !digest.All(Uri.IsHexDigit)) return null;
        try
        {
            byte[] bytes = Convert.FromBase64String(encoded);

            if (bytes.Length is <= 0 or > 1048576 ||
                !CryptographicOperations.FixedTimeEquals(SHA256.HashData(bytes), Convert.FromHexString(digest)))
                return null;
            var bindings = JsonSerializer.Deserialize<VerifiedDependencyIdentityBinding[]>(bytes);
            var now = clock.GetUtcNow();

            if (bindings is not { Length: > 0 and <= 10000 } || bindings.Any(b => b is null || b.Scope != request ||
                string.IsNullOrWhiteSpace(b.IdentityId) || string.IsNullOrWhiteSpace(b.ArtifactEvidenceId) ||
                string.IsNullOrWhiteSpace(b.BindingEvidenceId) || b.ObservedAt > now ||
                b.ValidUntil <= now || b.ValidUntil <= b.ObservedAt ||
                b.GrantedCapabilities is null || b.GrantedCapabilities.Count > 1000 ||
                b.GrantedCapabilities.Any(string.IsNullOrWhiteSpace))) return null;

            if (!await authority.CanReadAsync(request, ct) ||
                !string.Equals(section["PayloadBase64"], encoded, StringComparison.Ordinal) ||
                !string.Equals(section["VerifiedSha256"], digest, StringComparison.Ordinal) ||
                bindings.Any(b => b.ValidUntil <= clock.GetUtcNow())) return null;
            ct.ThrowIfCancellationRequested();
            return bindings;
        }
        catch (Exception ex) when (ex is FormatException or JsonException or CryptographicException)
        { return null; }
    }
}
