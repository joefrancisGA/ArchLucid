using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Requests;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>Persisted LLM USD rates on SQL-backed hosts (<c>POST /v1/admin/llm-cost-tuning</c>).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class AdminLlmCostTuningSqlIntegrationTests(GreenfieldSqlApiFactory fixture) : IClassFixture<GreenfieldSqlApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Post_persists_singleton_row_and_returns_204()
    {
        using HttpClient client = fixture.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        const decimal input = 12.34m;
        const decimal output = 56.78m;

        LlmCostTuningRequest body = new()
        {
            InputUsdPerMillionTokens = input,
            OutputUsdPerMillionTokens = output
        };

        using HttpResponseMessage response =
            await client.PostAsJsonAsync("/v1/admin/llm-cost-tuning", body, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using SqlConnection conn = new(fixture.SqlConnectionString);
        await conn.OpenAsync();

        (decimal InUsd, decimal OutUsd) row = await conn.QuerySingleAsync<(decimal InUsd, decimal OutUsd)>(
            """
            SELECT InputUsdPerMillionTokens AS InUsd, OutputUsdPerMillionTokens AS OutUsd
            FROM dbo.HostLlmCostEstimationUsdRates
            WHERE SingletonKey = N'G';
            """);

        row.InUsd.Should().Be(input);
        row.OutUsd.Should().Be(output);
    }
}
