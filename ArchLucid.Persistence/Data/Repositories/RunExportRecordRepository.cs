using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper-backed persistence for <see cref="IRunExportRecordRepository" />; persists and retrieves export records from
///     the <c>RunExportRecords</c> table.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class RunExportRecordRepository(IDbConnectionFactory connectionFactory) : IRunExportRecordRepository
{
    public async Task CreateAsync(
        RunExportRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);
        RunExportRecord persistRecord = NormalizeExportRecordForPersist(record);

        const string sql = """
                           INSERT INTO RunExportRecords
                           (
                               ExportRecordId,
                               RunId,
                               ExportType,
                               Format,
                               FileName,
                               TemplateProfile,
                               TemplateProfileDisplayName,
                               WasAutoSelected,
                               ResolutionReason,
                               ManifestVersion,
                               Notes,
                               AnalysisRequestJson,
                               IncludedEvidence,
                               IncludedExecutionTraces,
                               IncludedManifest,
                               IncludedDiagram,
                               IncludedSummary,
                               IncludedDeterminismCheck,
                               DeterminismIterations,
                               IncludedManifestCompare,
                               CompareManifestVersion,
                               IncludedAgentResultCompare,
                               CompareRunId,
                               RecordJson,
                               CreatedUtc
                           )
                           VALUES
                           (
                               @ExportRecordId,
                               @RunId,
                               @ExportType,
                               @Format,
                               @FileName,
                               @TemplateProfile,
                               @TemplateProfileDisplayName,
                               @WasAutoSelected,
                               @ResolutionReason,
                               @ManifestVersion,
                               @Notes,
                               @AnalysisRequestJson,
                               @IncludedEvidence,
                               @IncludedExecutionTraces,
                               @IncludedManifest,
                               @IncludedDiagram,
                               @IncludedSummary,
                               @IncludedDeterminismCheck,
                               @DeterminismIterations,
                               @IncludedManifestCompare,
                               @CompareManifestVersion,
                               @IncludedAgentResultCompare,
                               @CompareRunId,
                               @RecordJson,
                               @CreatedUtc
                           );
                           """;

        string json = JsonSerializer.Serialize(persistRecord, ContractJson.Default);

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                persistRecord.ExportRecordId,
                persistRecord.RunId,
                persistRecord.ExportType,
                persistRecord.Format,
                persistRecord.FileName,
                persistRecord.TemplateProfile,
                persistRecord.TemplateProfileDisplayName,
                persistRecord.WasAutoSelected,
                persistRecord.ResolutionReason,
                persistRecord.ManifestVersion,
                persistRecord.Notes,
                persistRecord.AnalysisRequestJson,
                persistRecord.IncludedEvidence,
                persistRecord.IncludedExecutionTraces,
                persistRecord.IncludedManifest,
                persistRecord.IncludedDiagram,
                persistRecord.IncludedSummary,
                persistRecord.IncludedDeterminismCheck,
                persistRecord.DeterminismIterations,
                persistRecord.IncludedManifestCompare,
                persistRecord.CompareManifestVersion,
                persistRecord.IncludedAgentResultCompare,
                persistRecord.CompareRunId,
                RecordJson = json,
                persistRecord.CreatedUtc
            },
            cancellationToken: cancellationToken));
    }

    private static RunExportRecord NormalizeExportRecordForPersist(RunExportRecord record)
    {
        string normalizedExportRecordId = ComparisonExportRecordIdLookup.NormalizeLookupKey(record.ExportRecordId);
        string normalizedRunId = record.RunId.Trim();

        RunExportRecord persistRecord;

        if (string.Equals(record.ExportRecordId, normalizedExportRecordId, StringComparison.Ordinal)
            && string.Equals(record.RunId, normalizedRunId, StringComparison.Ordinal))
        {
            persistRecord = record;
        }
        else
        {
            string json = JsonSerializer.Serialize(record, ContractJson.Default);
            RunExportRecord? copy = JsonSerializer.Deserialize<RunExportRecord>(json, ContractJson.Default);

            if (copy is null)
                throw new InvalidOperationException("RunExportRecord clone for persist produced null.");

            copy.ExportRecordId = normalizedExportRecordId;
            copy.RunId = normalizedRunId;
            persistRecord = copy;
        }

        RunExportRecordPersistNormalizer.NormalizeLoadedRecord(persistRecord);

        return persistRecord;
    }

    public async Task<IReadOnlyList<RunExportRecord>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<string> lookupKeys = RunExportRecordRunIdSql.LookupKeys(runId)
            .Select(static key => key.ToLowerInvariant())
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string sql = $"""
                      SELECT RecordJson
                      FROM RunExportRecords
                      WHERE LOWER(LTRIM(RTRIM(RunId))) IN @RunIds
                      ORDER BY CreatedUtc DESC
                      {SqlPagingSyntax.FirstRowsOnly(500)};
                      """;

        IEnumerable<string> rows = await connection.QueryAsync<string>(new CommandDefinition(
            sql,
            new { RunIds = lookupKeys },
            cancellationToken: cancellationToken));

        List<RunExportRecord> records = [];
        foreach (string json in rows)
        {
            RunExportRecord? record;
            try
            {
                record = JsonSerializer.Deserialize<RunExportRecord>(json, ContractJson.Default);
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException(
                    $"A RunExportRecord for run '{runId}' could not be deserialized. " +
                    "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
            }

            if (record is null)

                throw new InvalidOperationException(
                    $"A RunExportRecord row for run '{runId}' deserialized to null. " +
                    "The stored JSON may be empty or corrupt.");

            RunExportRecordPersistNormalizer.NormalizeLoadedRecord(record);
            records.Add(record);
        }

        return records;
    }

    public async Task<RunExportRecord?> GetByIdAsync(
        string exportRecordId,
        CancellationToken cancellationToken = default)
    {
        string normalizedExportRecordId = ComparisonExportRecordIdLookup.NormalizeLookupKey(exportRecordId);
        const string sql = """
                           SELECT RecordJson
                           FROM RunExportRecords
                           WHERE LOWER(LTRIM(RTRIM(ExportRecordId))) = LOWER(@ExportRecordId);
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? json = await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(
            sql,
            new { ExportRecordId = normalizedExportRecordId },
            cancellationToken: cancellationToken));

        if (json is null)
            return null;

        RunExportRecord? record;
        try
        {
            record = JsonSerializer.Deserialize<RunExportRecord>(json, ContractJson.Default);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"RunExportRecord JSON for '{normalizedExportRecordId}' could not be deserialized. " +
                "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
        }

        if (record is null)
            throw new InvalidOperationException(
                $"RunExportRecord JSON for '{exportRecordId}' deserialized to null. " +
                "The stored JSON may be empty or corrupt.");

        RunExportRecordPersistNormalizer.NormalizeLoadedRecord(record);

        return record;
    }
}
