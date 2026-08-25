using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Integrations;

public sealed partial class SqlItsmFindingCorrelationRepository
{
    private async Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyCoreAsync(
        string provider,
        string externalKey,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        const string sql = $"""
                           SELECT {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE Provider = @Provider AND ExternalKey = @ExternalKey;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { Provider = provider.Trim(), ExternalKey = externalKey.Trim() },
            cancellationToken: ct);

        List<ItsmFindingCorrelationRecord> matches =
            (await connection.QueryAsync<ItsmFindingCorrelationRecord>(cmd)).ToList();

        // Anonymous inbound webhooks have no tenant context; resolve only when unambiguous.
        if (matches.Count != 1)
            return null;

        return matches[0];
    }

    private async Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyForTenantCoreAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        const string sql = $"""
                           SELECT {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE TenantId = @TenantId AND Provider = @Provider AND ExternalKey = @ExternalKey;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new
            {
                TenantId = tenantId,
                Provider = provider.Trim(),
                ExternalKey = externalKey.Trim()
            },
            cancellationToken: ct);

        return await connection.QuerySingleOrDefaultAsync<ItsmFindingCorrelationRecord>(cmd);
    }

    private async Task<bool> FindingRecordExistsCoreAsync(
        Guid tenantId,
        string findingId,
        Guid? findingRecordId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        string sql = findingRecordId is Guid scopedRecordId
            ? """
              SELECT CASE WHEN EXISTS (
                  SELECT 1
                  FROM dbo.FindingRecords
                  WHERE TenantId = @TenantId AND FindingRecordId = @FindingRecordId
              ) THEN 1 ELSE 0 END;
              """
            : """
              SELECT CASE WHEN EXISTS (
                  SELECT 1
                  FROM dbo.FindingRecords
                  WHERE TenantId = @TenantId AND FindingId = @FindingId
              ) THEN 1 ELSE 0 END;
              """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new
            {
                TenantId = tenantId,
                FindingId = findingId.Trim(),
                FindingRecordId = findingRecordId
            },
            cancellationToken: ct);

        int exists = await connection.ExecuteScalarAsync<int>(cmd);

        return exists != 0;
    }

    private async Task<ItsmFindingCorrelationRecord?> TryGetByFindingAndProviderCoreAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));
        if (string.IsNullOrWhiteSpace(provider)) throw new ArgumentException("provider is required.", nameof(provider));

        const string sql = $"""
                           SELECT TOP (1) {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE TenantId = @TenantId AND FindingId = @FindingId AND Provider = @Provider
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, FindingId = findingId.Trim(), Provider = provider.Trim() },
            cancellationToken: ct);

        return await connection.QuerySingleOrDefaultAsync<ItsmFindingCorrelationRecord>(cmd);
    }

    private async Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingCoreAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        const string sql = $"""
                           SELECT {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE TenantId = @TenantId AND FindingId = @FindingId
                           ORDER BY CreatedUtc ASC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, FindingId = findingId.Trim() },
            cancellationToken: ct);

        IEnumerable<ItsmFindingCorrelationRecord> rows =
            await connection.QueryAsync<ItsmFindingCorrelationRecord>(cmd);

        return rows.ToList();
    }

    private async Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingsCoreAsync(
        Guid tenantId,
        IReadOnlyList<string> findingIds,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (findingIds is null)
            throw new ArgumentNullException(nameof(findingIds));

        List<string> normalizedFindingIds = findingIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (normalizedFindingIds.Count == 0)
            return Array.Empty<ItsmFindingCorrelationRecord>();

        const string sql = $"""
                           SELECT {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE TenantId = @TenantId AND FindingId IN @FindingIds
                           ORDER BY FindingId ASC, CreatedUtc ASC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, FindingIds = normalizedFindingIds },
            cancellationToken: ct);

        IEnumerable<ItsmFindingCorrelationRecord> rows =
            await connection.QueryAsync<ItsmFindingCorrelationRecord>(cmd);

        return rows.ToList();
    }
}
