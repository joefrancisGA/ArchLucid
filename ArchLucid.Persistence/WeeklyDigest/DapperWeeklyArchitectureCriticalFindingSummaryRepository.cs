using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.WeeklyDigest;

/// <inheritdoc cref="IWeeklyArchitectureCriticalFindingSummaryRepository"/>
/// <remarks>
///     Uses primary <see cref="SqlConnectionFactory"/> (singleton) so scheduling jobs do not require an HTTP-bound
///     <see cref="ArchLucid.Core.Scoping.ScopeContext"/>.
/// </remarks>
public sealed class DapperWeeklyArchitectureCriticalFindingSummaryRepository(SqlConnectionFactory sqlConnectionFactory)
    : IWeeklyArchitectureCriticalFindingSummaryRepository
{
    private readonly SqlConnectionFactory _sqlConnectionFactory =
        sqlConnectionFactory ?? throw new ArgumentNullException(nameof(sqlConnectionFactory));

    /// <inheritdoc />
    public async Task<WeeklyArchitectureCriticalFindingsSlice> ListRecentCriticalAsync(
        DateTime cutoffUtc,
        string criticalSeverityLiteral,
        int maxSampleRows,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(criticalSeverityLiteral);

        maxSampleRows = Math.Clamp(maxSampleRows, 1, 10_000);

        await using SqlConnection connection =
            await _sqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);


        CommandDefinition countCommand = new(
            """
            SELECT COUNT_BIG(1)
            FROM dbo.FindingRecords AS fr
            INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
            WHERE fs.CreatedUtc >= @CutoffUtc
              AND fs.ArchivedUtc IS NULL
              AND fr.Severity = @Severity;
            """,
            new
            {
                CutoffUtc = cutoffUtc,
                Severity = criticalSeverityLiteral,
            },
            cancellationToken: cancellationToken);

        long total = await connection.ExecuteScalarAsync<long>(countCommand).ConfigureAwait(false);

        CommandDefinition sampleCommand = new(
            """
            SELECT TOP (@MaxSample)
                   fr.FindingId,
                   fr.Title,
                   fr.Category,
                   fr.TenantId,
                   fs.CreatedUtc AS SnapshotCreatedUtc
            FROM dbo.FindingRecords AS fr
            INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
            WHERE fs.CreatedUtc >= @CutoffUtc
              AND fs.ArchivedUtc IS NULL
              AND fr.Severity = @Severity
            ORDER BY fs.CreatedUtc DESC,
                     fr.SortOrder ASC;
            """,
            new
            {
                MaxSample = maxSampleRows,
                CutoffUtc = cutoffUtc,
                Severity = criticalSeverityLiteral,
            },
            cancellationToken: cancellationToken);

        IReadOnlyList<WeeklyArchitectureCriticalFindingDto> rows =
            (await connection
                .QueryAsync<WeeklyArchitectureCriticalFindingDto>(sampleCommand)
                .ConfigureAwait(false)).AsList();

        return new WeeklyArchitectureCriticalFindingsSlice { ApproximateMatchingCount = total, SampleRows = rows };
    }
}