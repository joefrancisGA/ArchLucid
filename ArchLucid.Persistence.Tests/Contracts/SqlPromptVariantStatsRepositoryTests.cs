using ArchLucid.Persistence.Data.Repositories;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Contracts;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlPromptVariantStatsRepositoryTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task GetStatsByTemplateAsync_AggregatesEachVariantIndependently()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        string template = Guid.NewGuid().ToString("N");
        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        try
        {
            await connection.ExecuteAsync(
                """
                INSERT INTO dbo.AgentOutputEvaluations (
                    RunId, PromptTemplateName, PromptVariantKey, AgentType, SemanticScore, QualityGatePassed, CreatedUtc)
                VALUES
                    (N'run-1', @Template, N'a', N'Topology', 0.25, 0, SYSUTCDATETIME()),
                    (N'run-2', @Template, N'a', N'Topology', 0.75, 1, SYSUTCDATETIME()),
                    (N'run-3', @Template, N'b', N'Topology', 1.00, 1, SYSUTCDATETIME());
                """,
                new { Template = template });

            SqlPromptVariantStatsRepository reader = new(new TestSqlDbConnectionFactory(fixture.ConnectionString));
            IReadOnlyList<PromptVariantStatsRow> rows = await reader.GetStatsByTemplateAsync(template);
            Assert.Collection(
                rows,
                a =>
                {
                    Assert.Equal("a", a.VariantKey);
                    Assert.Equal(2, a.SampleCount);
                    Assert.Equal(0.5, a.MeanSemanticScore);
                    Assert.Equal(0.5, a.MedianSemanticScore);
                    Assert.Equal(0.5, a.QualityGatePassRate);
                },
                b =>
                {
                    Assert.Equal("b", b.VariantKey);
                    Assert.Equal(1, b.SampleCount);
                    Assert.Equal(1.0, b.MeanSemanticScore);
                    Assert.Equal(1.0, b.MedianSemanticScore);
                    Assert.Equal(1.0, b.QualityGatePassRate);
                });
        }
        finally
        {
            await connection.ExecuteAsync("DELETE FROM dbo.AgentOutputEvaluations WHERE PromptTemplateName = @Template;",
                new { Template = template });
        }
    }
}
