using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Integrations;

public sealed partial class SqlItsmFindingCorrelationRepository
{
    private async Task<Guid?> TryResolveFindingRecordIdForRunFindingCoreAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (runId == Guid.Empty) throw new ArgumentException("runId is required.", nameof(runId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        const string sql = """
                           SELECT TOP (1) fr.FindingRecordId
                           FROM dbo.FindingRecords AS fr
                           INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                           INNER JOIN dbo.Runs AS r ON r.RunId = fs.RunId
                           WHERE fr.TenantId = @TenantId
                             AND r.RunId = @RunId
                             AND fr.FindingId = @FindingId
                             AND r.ArchivedUtc IS NULL;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, RunId = runId, FindingId = findingId.Trim() },
            cancellationToken: ct);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(cmd);
    }

    private async Task<Guid?> TryResolveLatestCommittedFindingRecordIdCoreAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        const string sql = """
                           SELECT TOP (1) fr.FindingRecordId
                           FROM dbo.FindingRecords AS fr
                           INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                           INNER JOIN dbo.Runs AS r ON r.RunId = fs.RunId
                           WHERE fr.TenantId = @TenantId
                             AND fr.FindingId = @FindingId
                             AND r.GoldenManifestId IS NOT NULL
                             AND r.ArchivedUtc IS NULL
                           ORDER BY COALESCE(r.CompletedUtc, r.CreatedUtc) DESC, fr.FindingRecordId DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, FindingId = findingId.Trim() },
            cancellationToken: ct);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(cmd);
    }
}
