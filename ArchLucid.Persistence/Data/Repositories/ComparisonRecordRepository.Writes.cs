// stryker disable all
using System.Data;

using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Repositories;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class ComparisonRecordRepository
{
    public async Task CreateAsync(
        ComparisonRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        ComparisonRecordRunIdSql.ThrowIfNonEmptyButNotGuid(record.LeftRunId, nameof(record.LeftRunId));
        ComparisonRecordRunIdSql.ThrowIfNonEmptyButNotGuid(record.RightRunId, nameof(record.RightRunId));
        Guid? leftRun = ComparisonRecordRunIdSql.ToNullableSqlGuid(record.LeftRunId);
        Guid? rightRun = ComparisonRecordRunIdSql.ToNullableSqlGuid(record.RightRunId);

        const string sql = """
                           INSERT INTO ComparisonRecords
                           (
                               ComparisonRecordId,
                               ComparisonType,
                               LeftRunId,
                               RightRunId,
                               LeftManifestVersion,
                               RightManifestVersion,
                               LeftExportRecordId,
                               RightExportRecordId,
                               Format,
                               SummaryMarkdown,
                               PayloadJson,
                               Notes,
                               CreatedUtc,
                               Label,
                               Tags
                           )
                           VALUES
                           (
                               @ComparisonRecordId,
                               @ComparisonType,
                               @LeftRunId,
                               @RightRunId,
                               @LeftManifestVersion,
                               @RightManifestVersion,
                               @LeftExportRecordId,
                               @RightExportRecordId,
                               @Format,
                               @SummaryMarkdown,
                               @PayloadJson,
                               @Notes,
                               @CreatedUtc,
                               @Label,
                               @Tags
                           );
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                record.ComparisonRecordId,
                record.ComparisonType,
                LeftRunId = leftRun,
                RightRunId = rightRun,
                record.LeftManifestVersion,
                record.RightManifestVersion,
                record.LeftExportRecordId,
                record.RightExportRecordId,
                record.Format,
                record.SummaryMarkdown,
                record.PayloadJson,
                record.Notes,
                record.CreatedUtc,
                record.Label,
                record.Tags
            },
            cancellationToken: cancellationToken));
    }

    public async Task<bool> UpdateLabelAndTagsAsync(
        string comparisonRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(comparisonRecordId);

        const string sql = """
                           UPDATE ComparisonRecords
                           SET Label = @Label,
                               Tags = @Tags
                           WHERE ComparisonRecordId = @ComparisonRecordId;
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        string? tagsJson = ComparisonRecordRepositoryCore.SerializeTagsForUpdate(tags);
        int rows = await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new { ComparisonRecordId = comparisonRecordId, Label = label ?? (object)DBNull.Value, Tags = tagsJson ?? (object)DBNull.Value },
            cancellationToken: cancellationToken));
        return rows > 0;
    }
}
