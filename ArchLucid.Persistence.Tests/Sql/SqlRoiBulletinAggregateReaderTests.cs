using ArchLucid.Core.GoToMarket;
using ArchLucid.Persistence.GoToMarket;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Sql;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlRoiBulletinAggregateReaderTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task ReadAsync_ReturnsOneAggregateForTheWindowAndAppliesTheSampleThreshold()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        DateTimeOffset start = DateTimeOffset.UtcNow.AddYears(20);
        RoiBulletinQuarterWindow window = new("Test window", start, start.AddSeconds(1));
        Guid first = Guid.NewGuid();
        Guid second = Guid.NewGuid();
        Guid outside = Guid.NewGuid();
        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        try
        {
            const string insert = """
                                  INSERT INTO dbo.Tenants (
                                      Id, Name, Slug, Tier, BaselineReviewCycleHours, BaselineReviewCycleCapturedUtc)
                                  VALUES (@Id, N'ROI fixture', @Slug, N'Standard', @Hours, @CapturedUtc);
                                  """;
            await connection.ExecuteAsync(insert, new[]
            {
                new { Id = first, Slug = first.ToString("N"), Hours = 10m, CapturedUtc = start },
                new { Id = second, Slug = second.ToString("N"), Hours = 30m, CapturedUtc = start },
                new { Id = outside, Slug = outside.ToString("N"), Hours = 100m, CapturedUtc = window.EndUtcExclusive },
            });

            SqlRoiBulletinAggregateReader reader = new(new TestSqlConnectionFactory(fixture.ConnectionString));
            RoiBulletinAggregateReadResult result = await reader.ReadAsync(window, 2);
            Assert.True(result.IsSufficientSample);
            Assert.Equal(2, result.TenantCount);
            Assert.Equal(20m, result.MeanBaselineHours);
            Assert.Equal(20m, result.MedianBaselineHours);
            Assert.Equal(28m, result.P90BaselineHours);

            RoiBulletinAggregateReadResult belowThreshold = await reader.ReadAsync(window, 3);
            Assert.False(belowThreshold.IsSufficientSample);
            Assert.Equal(2, belowThreshold.TenantCount);
            Assert.Null(belowThreshold.MeanBaselineHours);
            Assert.Null(belowThreshold.MedianBaselineHours);
            Assert.Null(belowThreshold.P90BaselineHours);
        }
        finally
        {
            await connection.ExecuteAsync(
                "DELETE FROM dbo.Tenants WHERE Id IN @Ids;", new { Ids = new[] { first, second, outside } });
        }
    }
}
