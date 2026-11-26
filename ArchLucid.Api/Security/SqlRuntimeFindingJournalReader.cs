using System.Data;
using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Persistence.Connections;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Security;

internal sealed record RuntimeFindingJournalEntry(DateTime RecordedUtc, string PayloadHash,
    RuntimeCatalogAssessment Assessment);

// Historical evidence only: reading an old observation never establishes current exposure.
internal sealed class SqlRuntimeFindingJournalReader(ISqlConnectionFactory? connections,
    IRuntimeTelemetryReadAuthority authority)
{
    public async Task<IReadOnlyList<RuntimeFindingJournalEntry>?> ReadAsync(
        RuntimeObservationRequest request, int limit, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (connections is null || limit is < 1 or > 20 || request.TenantId == Guid.Empty ||
            request.WorkspaceId == Guid.Empty || request.ProjectId == Guid.Empty ||
            string.IsNullOrWhiteSpace(request.ResourceId) || string.IsNullOrWhiteSpace(request.DeploymentGeneration) ||
            string.IsNullOrWhiteSpace(request.RuntimeFamily) || !await authority.CanReadAsync(request, ct))
            return null;
        try
        {
            await using var connection = await connections.CreateOpenConnectionAsync(ct);
            await using var command = connection.CreateCommand();
            command.CommandTimeout = 15;
            command.CommandText = """
                SELECT TOP (@limit) RecordedUtc, PayloadHash, Payload
                FROM dbo.RuntimeFindingEvidenceJournal
                WHERE TenantId=@tenant AND WorkspaceId=@workspace AND ProjectId=@project AND ScopeHash=@scopeHash
                ORDER BY RecordedUtc DESC, PayloadHash DESC;
                """;
            command.Parameters.Add("@limit", SqlDbType.Int).Value = limit;
            command.Parameters.Add("@tenant", SqlDbType.UniqueIdentifier).Value = request.TenantId;
            command.Parameters.Add("@workspace", SqlDbType.UniqueIdentifier).Value = request.WorkspaceId;
            command.Parameters.Add("@project", SqlDbType.UniqueIdentifier).Value = request.ProjectId;
            command.Parameters.Add("@scopeHash", SqlDbType.Binary, 32).Value =
                Convert.FromHexString(RuntimeTelemetryProvisioning.ScopeKey(request));
            var entries = new List<RuntimeFindingJournalEntry>();
            await using (var reader = await command.ExecuteReaderAsync(ct))
            {
                while (await reader.ReadAsync(ct))
                {
                    var hash = reader.GetFieldValue<byte[]>(1);
                    var bytes = reader.GetFieldValue<byte[]>(2);
                    var entry = Validate(request, reader.GetDateTime(0), hash, bytes);
                    if (entry is null) return null;
                    entries.Add(entry);
                }
            }
            ct.ThrowIfCancellationRequested();
            return await authority.CanReadAsync(request, ct) ? entries.ToArray() : null;
        }
        catch (Exception ex) when (ex is SqlException or InvalidOperationException or TimeoutException
            or UnauthorizedAccessException or JsonException)
        { return null; }
    }

    internal static RuntimeFindingJournalEntry? Validate(RuntimeObservationRequest request,
        DateTime recordedUtc, byte[] hash, byte[] bytes)
    {
        if (hash is not { Length: 32 } || bytes is not { Length: > 0 and <= 1048576 } ||
            !CryptographicOperations.FixedTimeEquals(hash, SHA256.HashData(bytes))) return null;
        try
        {
            var assessment = JsonSerializer.Deserialize<RuntimeCatalogAssessment>(bytes);
            if (assessment is null || !assessment.CatalogCurrent || assessment.Findings is null ||
                assessment.LifecycleFindings is null ||
                assessment.Findings.Count + assessment.LifecycleFindings.Count is <= 0 or > 2000 ||
                assessment.Findings.Any(f => f is null || f.Scope != request) ||
                assessment.LifecycleFindings.Any(f => f is null || f.Scope != request)) return null;
            return new(DateTime.SpecifyKind(recordedUtc, DateTimeKind.Utc), Convert.ToHexString(hash), assessment);
        }
        catch (JsonException) { return null; }
    }
}
