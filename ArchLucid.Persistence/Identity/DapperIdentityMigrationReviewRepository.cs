using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperIdentityMigrationReviewRepository(ISqlConnectionFactory connectionFactory)
    : IIdentityMigrationReviewRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task UpsertAsync(
        string legacySourceType,
        Guid legacySourceId,
        Guid? tenantId,
        IdentityMigrationReviewReason reasonCode,
        string reasonDetail,
        DateTimeOffset detectedUtc,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(legacySourceType);
        ArgumentException.ThrowIfNullOrWhiteSpace(reasonDetail);

        const string sql = """
                           MERGE dbo.IdentityMigrationReviewItems AS target
                           USING (SELECT @LegacySourceType AS LegacySourceType, @LegacySourceId AS LegacySourceId, @ReasonCode AS ReasonCode) AS source
                               ON target.LegacySourceType = source.LegacySourceType
                              AND target.LegacySourceId = source.LegacySourceId
                              AND target.ReasonCode = source.ReasonCode
                           WHEN MATCHED THEN
                               UPDATE SET TenantId = @TenantId,
                                          ReasonCode = @ReasonCode,
                                          ReasonDetail = @ReasonDetail,
                                          DetectedUtc = @DetectedUtc,
                                          ResolvedUtc = NULL
                           WHEN NOT MATCHED THEN
                               INSERT (LegacySourceType, LegacySourceId, TenantId, ReasonCode, ReasonDetail, DetectedUtc)
                               VALUES (@LegacySourceType, @LegacySourceId, @TenantId, @ReasonCode, @ReasonDetail, @DetectedUtc);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    LegacySourceType = legacySourceType.Trim(),
                    LegacySourceId = legacySourceId,
                    TenantId = tenantId,
                    ReasonCode = reasonCode.ToString(),
                    ReasonDetail = reasonDetail.Trim(),
                    DetectedUtc = detectedUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<IdentityMigrationReviewItemRecord>> ListUnresolvedAsync(CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, LegacySourceType, LegacySourceId, TenantId, ReasonCode, ReasonDetail, DetectedUtc, ResolvedUtc
                           FROM dbo.IdentityMigrationReviewItems
                           WHERE ResolvedUtc IS NULL
                           ORDER BY DetectedUtc DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ReviewRow> rows = await connection.QueryAsync<ReviewRow>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return rows.Select(static row => row.ToRecord()).ToList();
    }

    private sealed class ReviewRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public string LegacySourceType
        {
            get;
            init;
        } = string.Empty;

        public Guid LegacySourceId
        {
            get;
            init;
        }

        public Guid? TenantId
        {
            get;
            init;
        }

        public string ReasonCode
        {
            get;
            init;
        } = string.Empty;

        public string ReasonDetail
        {
            get;
            init;
        } = string.Empty;

        public DateTime DetectedUtc
        {
            get;
            init;
        }

        public DateTime? ResolvedUtc
        {
            get;
            init;
        }

        public IdentityMigrationReviewItemRecord ToRecord() =>
            new()
            {
                Id = Id,
                LegacySourceType = LegacySourceType,
                LegacySourceId = LegacySourceId,
                TenantId = TenantId,
                ReasonCode = Enum.Parse<IdentityMigrationReviewReason>(ReasonCode),
                ReasonDetail = ReasonDetail,
                DetectedUtc = DetectedUtc,
                ResolvedUtc = ResolvedUtc
            };
    }
}
