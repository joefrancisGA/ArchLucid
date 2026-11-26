using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Security;

// Public keys come from independent server configuration, not the envelope spool.
// Reloadable configuration permits rotation and revocation without positive caching.
internal sealed class ProvisionedRuntimeTelemetryTrustRegistry(IConfiguration config, TimeProvider clock)
    : IRuntimeTelemetryTrustRegistry
{
    public Task<byte[]?> ReadCurrentKeyAsync(RuntimeObservationRequest request, string keyId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!RuntimeTelemetryProvisioning.Enabled(config) || string.IsNullOrWhiteSpace(keyId) ||
            keyId.Length > 128 || !keyId.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.'))
            return Task.FromResult<byte[]?>(null);
        var key = RuntimeTelemetryProvisioning.Scope(config, request).GetSection("Keys:" + keyId);

        if (!bool.TryParse(key["Enabled"], out var enabled) || !enabled ||
            !DateTimeOffset.TryParse(key["NotBefore"], System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.RoundtripKind, out var start) ||
            !DateTimeOffset.TryParse(key["ExpiresAt"], System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.RoundtripKind, out var end))
            return Task.FromResult<byte[]?>(null);
        var now = clock.GetUtcNow();
        string? encoded = key["PublicKeyBase64"];

        if (now < start || now >= end || string.IsNullOrWhiteSpace(encoded) || encoded.Length > 684)
            return Task.FromResult<byte[]?>(null);
        try
        {
            byte[] bytes = Convert.FromBase64String(encoded);
            return Task.FromResult<byte[]?>(bytes.Length is > 0 and <= 512 ? bytes : null);
        }
        catch (FormatException) { return Task.FromResult<byte[]?>(null); }
    }
}
