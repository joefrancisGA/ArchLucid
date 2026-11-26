using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
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
    IConfiguration config, IHttpContextAccessor http, ICentralAuthorizationDecisions decisions,
    IAzureInventorySnapshotRepository inventory, TimeProvider clock)
    : IRuntimeTelemetryReadAuthority
{
    public async Task<bool> CanReadAsync(RuntimeObservationRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var principal = http.HttpContext?.User;
        if (!RuntimeTelemetryProvisioning.Enabled(config) || principal?.Identity?.IsAuthenticated != true ||
            !Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["EvidenceRunId"], out var runId) ||
            runId == Guid.Empty ||
            !Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["InventorySnapshotId"], out var snapshotId) ||
            snapshotId == Guid.Empty)
            return false;
        var decision = await decisions.DecideAsync(principal,
            new("evidence.read", request.TenantId, request.WorkspaceId, request.ProjectId, runId),
            cancellationToken);
        if (!decision.Allowed) return false;
        var scope = new ScopeContext { TenantId = request.TenantId, WorkspaceId = request.WorkspaceId, ProjectId = request.ProjectId };
        var detail = await inventory.TryGetCanonicalSnapshotDetailAsync(scope, snapshotId, cancellationToken);
        if (detail is null || detail.Header is not { } header ||
            header.SnapshotId != snapshotId || header.TenantId != request.TenantId ||
            header.WorkspaceId != request.WorkspaceId || header.ProjectId != request.ProjectId ||
            header.CapturedUtc is not DateTime captured || captured.Kind != DateTimeKind.Utc ||
            captured > clock.GetUtcNow().UtcDateTime || clock.GetUtcNow().UtcDateTime - captured > TimeSpan.FromHours(24) ||
            detail.Resources.Count(row => row.TenantId == request.TenantId && row.SnapshotId == snapshotId &&
                string.Equals(row.AzureResourceId, request.ResourceId, StringComparison.OrdinalIgnoreCase)) != 1)
            return false;
        cancellationToken.ThrowIfCancellationRequested();
        return RuntimeTelemetryProvisioning.Enabled(config) &&
            Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["EvidenceRunId"], out var current)
            && current == runId &&
            Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["InventorySnapshotId"], out var currentSnapshot)
            && currentSnapshot == snapshotId;
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
            var path = Path.Combine(Path.GetFullPath(root), RuntimeTelemetryProvisioning.ScopeKey(request) + ".json");
            if (!RuntimeTelemetrySpoolPath.IsRegularFileUnderPlainDirectories(path)) return null;
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
            if (!RuntimeTelemetrySpoolPath.IsRegularFileUnderPlainDirectories(path)) return null;
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
        services.AddScoped<IRuntimeAttestationReplayGuard>(provider =>
            new SqlRuntimeAttestationReplayGuard(provider.GetService<ArchLucid.Persistence.Connections.ISqlConnectionFactory>()));
        services.AddScoped<IAuthorizedRuntimeObservationSource, SignedRuntimeObservationSource>();
        services.AddScoped<RuntimeObservationAdapter>();
        services.AddScoped<RuntimeDeploymentAdvisoryEvaluator>();
        services.AddScoped<RuntimeDeploymentLifecycleEvaluator>();
        services.AddScoped<IVerifiedRuntimeAdvisoryCatalogSource, ProvisionedRuntimeAdvisoryCatalogSource>();
        services.AddScoped<RuntimeAdvisoryFindingService>();
        services.AddScoped<IRuntimeFindingJournal>(provider => new SqlRuntimeFindingJournal(
            provider.GetService<ArchLucid.Persistence.Connections.ISqlConnectionFactory>(),
            provider.GetRequiredService<IConfiguration>(),
            provider.GetRequiredService<IRuntimeAttestationPublicationAuthority>()));
        services.AddScoped<RuntimeFindingPersistenceService>();
        services.AddScoped<IRuntimeAttestationPublicationAuthority, ProvisionedRuntimePublicationAuthority>();
        services.AddScoped<IRuntimeAttestationPublicationStore, AtomicRuntimeAttestationPublicationStore>();
        services.AddHttpClient("SecureNowRuntimeKeyVault", client => client.Timeout = TimeSpan.FromSeconds(15))
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                AllowAutoRedirect = false,
                UseCookies = false,
            });
        services.AddScoped<IScopedRuntimeDigestSigner>(provider => new KeyVaultRuntimeDigestSigner(
            provider.GetRequiredService<IConfiguration>(),
            new Azure.Identity.ManagedIdentityCredential(Azure.Identity.ManagedIdentityId.SystemAssigned),
            provider.GetRequiredService<IHttpClientFactory>().CreateClient("SecureNowRuntimeKeyVault"),
            provider.GetRequiredService<IRuntimeAttestationPublicationAuthority>(),
            provider.GetRequiredService<IRuntimeTelemetryTrustRegistry>()));
        // No fabricated process evidence: hosts without a trusted collector return unavailable.
        Microsoft.Extensions.DependencyInjection.Extensions.ServiceCollectionDescriptorExtensions.TryAddScoped<
            IRuntimeProcessEvidenceCollector, SignedWorkloadProcessEvidenceCollector>(services);
        services.AddScoped<IAuthorizedRuntimeAttestationProducer, AuthorizedRuntimeAttestationProducer>();
        services.AddScoped<RuntimeAttestationPublisher>();
        return services;
    }
}
