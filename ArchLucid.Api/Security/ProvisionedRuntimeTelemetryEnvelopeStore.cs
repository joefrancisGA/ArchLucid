using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Security;

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
