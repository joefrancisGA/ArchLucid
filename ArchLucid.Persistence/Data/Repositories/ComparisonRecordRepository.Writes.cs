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

        ComparisonRecord persistRecord = ComparisonRecordRepositoryCore.Clone(record);
        ComparisonRecordPersistNormalizer.NormalizeForPersist(persistRecord);

        ComparisonRecordRunIdSql.ThrowIfNonEmptyButNotGuid(persistRecord.LeftRunId, nameof(persistRecord.LeftRunId));
        ComparisonRecordRunIdSql.ThrowIfNonEmptyButNotGuid(persistRecord.RightRunId, nameof(persistRecord.RightRunId));
        Guid? leftRun = ComparisonRecordRunIdSql.ToNullableSqlGuid(persistRecord.LeftRunId);
        Guid? rightRun = ComparisonRecordRunIdSql.ToNullableSqlGuid(persistRecord.RightRunId);

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
                persistRecord.ComparisonRecordId,
                persistRecord.ComparisonType,
                LeftRunId = leftRun,
                RightRunId = rightRun,
                persistRecord.LeftManifestVersion,
                persistRecord.RightManifestVersion,
                persistRecord.LeftExportRecordId,
                persistRecord.RightExportRecordId,
                persistRecord.Format,
                persistRecord.SummaryMarkdown,
                persistRecord.PayloadJson,
                persistRecord.Notes,
                persistRecord.CreatedUtc,
                persistRecord.Label,
                persistRecord.Tags
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
        string normalizedComparisonRecordId = ComparisonRecordIdLookup.NormalizeLookupKey(comparisonRecordId);

        string sql = $"""
                      UPDATE ComparisonRecords
                      SET Label = @Label,
                          Tags = @Tags
                      WHERE LOWER({ComparisonRecordIdSql.TrimmedColumnExpression}) = LOWER(@ComparisonRecordId);
                      """;

        (string? normalizedLabel, IReadOnlyList<string>? normalizedTags) =
            ComparisonRecordRepositoryCore.NormalizeLabelAndTagsForUpdate(label, tags);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        string? tagsJson = ComparisonRecordRepositoryCore.SerializeTagsForUpdate(normalizedTags);
        int rows = await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                ComparisonRecordId = normalizedComparisonRecordId,
                Label = normalizedLabel ?? (object)DBNull.Value,
                Tags = tagsJson ?? (object)DBNull.Value
            },
            cancellationToken: cancellationToken));
        return rows > 0;
    }
}
