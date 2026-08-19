using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Pilots;

public sealed class DapperPilotBaselineRepository(ISqlConnectionFactory connectionFactory) : IPilotBaselineRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<PilotBaselineRecord?> GetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TenantId, BaselineHoursPerReview, BaselineReviewsPerQuarter, BaselineArchitectHourlyCost,
                                  UpdatedUtc
                           FROM dbo.PilotBaselines
                           WHERE TenantId = @TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        BaselineRow? row = await connection.QuerySingleOrDefaultAsync<BaselineRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        if (row is null)
            return null;

        return new PilotBaselineRecord
        {
            TenantId = row.TenantId,
            BaselineHoursPerReview = row.BaselineHoursPerReview,
            BaselineReviewsPerQuarter = row.BaselineReviewsPerQuarter,
            BaselineArchitectHourlyCost = row.BaselineArchitectHourlyCost,
            UpdatedUtc = new DateTimeOffset(DateTime.SpecifyKind(row.UpdatedUtc, DateTimeKind.Utc))
        };
    }

    private sealed class BaselineRow
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public decimal? BaselineHoursPerReview
        {
            get;
            init;
        }

        public int? BaselineReviewsPerQuarter
        {
            get;
            init;
        }

        public decimal? BaselineArchitectHourlyCost
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }

    public async Task UpsertAsync(PilotBaselineRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           IF EXISTS (SELECT 1 FROM dbo.PilotBaselines WHERE TenantId = @TenantId)
                               UPDATE dbo.PilotBaselines
                               SET BaselineHoursPerReview = @BaselineHoursPerReview,
                                   BaselineReviewsPerQuarter = @BaselineReviewsPerQuarter,
                                   BaselineArchitectHourlyCost = @BaselineArchitectHourlyCost,
                                   UpdatedUtc = SYSUTCDATETIME()
                               WHERE TenantId = @TenantId;
                           ELSE
                               INSERT INTO dbo.PilotBaselines
                                   (TenantId, BaselineHoursPerReview, BaselineReviewsPerQuarter, BaselineArchitectHourlyCost, UpdatedUtc)
                               VALUES
                                   (@TenantId, @BaselineHoursPerReview, @BaselineReviewsPerQuarter, @BaselineArchitectHourlyCost, SYSUTCDATETIME());
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { record.TenantId, record.BaselineHoursPerReview, record.BaselineReviewsPerQuarter, record.BaselineArchitectHourlyCost },
                cancellationToken: cancellationToken));
    }
}
