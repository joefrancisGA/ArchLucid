using System.Net;

using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests.Planning;

/// <summary>
///     Covers authenticated Planning (<see cref="ArchLucid.Api.Controllers.Planning.GraphController" />) and Governance
///     (<see cref="ArchLucid.Api.Controllers.Governance.GovernanceController" />) surfaces behind commercial-tier gates —
///     complements Moq-only <see cref="CommercialTenantTierFilterTests" /> with HTTP routing smoke against SQL-backed tier rows.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class PlanningGovernanceCommercialSmokeIntegrationTests : IClassFixture<ArchLucidApiFactory>, IAsyncLifetime
{
    private readonly ArchLucidApiFactory _factory;

    public PlanningGovernanceCommercialSmokeIntegrationTests(ArchLucidApiFactory factory)
    {
        _factory = factory;
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    public async Task InitializeAsync()
    {
        await UpsertCommercialTenantAsync(_factory.SqlConnectionString);
    }

    [Fact]
    public async Task Get_graph_run_returns_404_when_no_snapshot_exists()
    {
        HttpClient client = _factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        Guid fakeRunId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        using HttpResponseMessage response =
            await client.GetAsync($"/v1/graph/runs/{fakeRunId:D}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Get_governance_dashboard_returns_200_when_tenant_meets_standard_tier()
    {
        HttpClient client = _factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response =
            await client.GetAsync("/v1/governance/dashboard");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private static async Task UpsertCommercialTenantAsync(string connectionString)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using (SqlCommand bypass = connection.CreateCommand())
        {
            bypass.CommandText = "EXEC sys.sp_set_session_context @key, @value, @read_only;";
            bypass.Parameters.AddWithValue("@key", "al_rls_bypass");
            bypass.Parameters.AddWithValue("@value", 1);
            bypass.Parameters.AddWithValue("@read_only", 0);
            await bypass.ExecuteNonQueryAsync();
        }

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            IF EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @Tid)
                UPDATE dbo.Tenants SET Tier = N'Standard' WHERE Id = @Tid;
            ELSE
                INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId)
                VALUES (@Tid, N'Standard-tier smoke tenant', N'standard-tier-smoke', N'Standard', NULL);
            """;
        cmd.Parameters.AddWithValue("@Tid", ScopeIds.DefaultTenant);
        await cmd.ExecuteNonQueryAsync();
    }
}
