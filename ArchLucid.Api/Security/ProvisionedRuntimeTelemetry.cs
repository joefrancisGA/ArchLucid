using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Security;

// Explicit opt-in server provisioning. The exact runtime scope maps to an authorized
// evidence run; a project role by itself is insufficient. No request-supplied paths.
internal static class RuntimeTelemetryProvisioning
{
    internal static string ScopeKey(RuntimeObservationRequest request) =>
        Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(request)));

    internal static IConfigurationSection Scope(IConfiguration config, RuntimeObservationRequest request) =>
        config.GetSection("SecureNow:RuntimeTelemetry:Scopes:" + ScopeKey(request));

    internal static bool Enabled(IConfiguration config) =>
        bool.TryParse(config["SecureNow:RuntimeTelemetry:Enabled"], out bool enabled) && enabled;
}

internal sealed class ProvisionedRuntimeTelemetryAuthority(
    IConfiguration config, IHttpContextAccessor http, ICentralAuthorizationDecisions decisions)
    : IRuntimeTelemetryReadAuthority
{
    public async Task<bool> CanReadAsync(RuntimeObservationRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var principal = http.HttpContext?.User;
        if (!RuntimeTelemetryProvisioning.Enabled(config) || principal?.Identity?.IsAuthenticated != true ||
            !Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["EvidenceRunId"], out var runId) ||
            runId == Guid.Empty)
            return false;
        var decision = await decisions.DecideAsync(principal,
            new("evidence.read", request.TenantId, request.WorkspaceId, request.ProjectId, runId),
            cancellationToken);
        return decision.Allowed && RuntimeTelemetryProvisioning.Enabled(config) &&
            Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["EvidenceRunId"], out var current)
            && current == runId;
    }
}

// Read-only spool. Administrators must provision a dedicated, ACL-protected local
// directory; only trusted producers may publish atomically to this directory.
// Do not configure a shared or user-writable root.
internal sealed class ProvisionedRuntimeTelemetryEnvelopeStore(IConfiguration config)
    : IRuntimeTelemetryEnvelopeStore
{
    private const int MaximumEnvelopeBytes = 1_500_000;

    public async Task<SignedRuntimeObservationEnvelope?> ReadExactAsync(
        RuntimeObservationRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        string? root = config["SecureNow:RuntimeTelemetry:SpoolRoot"];
        if (!RuntimeTelemetryProvisioning.Enabled(config) || string.IsNullOrWhiteSpace(root) ||
            !Path.IsPathFullyQualified(root) ||
            !Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["EvidenceRunId"], out var runId) ||
            runId == Guid.Empty)
            return null;
        try
        {
            var path = Path.Combine(root, RuntimeTelemetryProvisioning.ScopeKey(request) + ".json");
            if ((File.GetAttributes(path) & FileAttributes.ReparsePoint) != 0) return null;
            await using var stream = new FileStream(path, FileMode.Open, FileAccess.Read,
                FileShare.Read, 8192, FileOptions.Asynchronous | FileOptions.SequentialScan);
            if (stream.Length is <= 0 or > MaximumEnvelopeBytes) return null;
            using var buffer = new MemoryStream();
            var chunk = new byte[8192];
            int read;
            while ((read = await stream.ReadAsync(chunk.AsMemory(), cancellationToken)) != 0)
            {
                if (buffer.Length + read > MaximumEnvelopeBytes) return null;
                buffer.Write(chunk, 0, read);
            }
            return JsonSerializer.Deserialize<SignedRuntimeObservationEnvelope>(buffer.ToArray());
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or JsonException or ArgumentException)
        {
            return null;
        }
    }
}

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

internal static class RuntimeTelemetryRegistration
{
    internal static IServiceCollection AddProvisionedRuntimeTelemetry(this IServiceCollection services)
    {
        services.AddScoped<IRuntimeTelemetryReadAuthority, ProvisionedRuntimeTelemetryAuthority>();
        services.AddScoped<IRuntimeTelemetryEnvelopeStore, ProvisionedRuntimeTelemetryEnvelopeStore>();
        services.AddScoped<IRuntimeTelemetryTrustRegistry, ProvisionedRuntimeTelemetryTrustRegistry>();
        services.AddScoped<IScopedRuntimeTelemetryReader, ScopedRuntimeTelemetryReader>();
        services.AddSingleton<IRuntimeAttestationReplayGuard, ProcessRuntimeAttestationReplayGuard>();
        services.AddScoped<IAuthorizedRuntimeObservationSource, SignedRuntimeObservationSource>();
        services.AddScoped<RuntimeObservationAdapter>();
        return services;
    }
}
