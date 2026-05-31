using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Core.Budgeting;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/admin/llm-monthly-dollar-budget-status</c>.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AdminLlmMonthlyDollarBudgetStatusEndpointTests
{
    private const string EndpointPath = "/v1/admin/llm-monthly-dollar-budget-status";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Get_WithReaderRole_Returns403_BecauseAdminAuthorityIsRequired()
    {
        await using ReaderRoleArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync(EndpointPath);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Get_WithDevelopmentBypassDefaultRole_Returns200_WithDeserializableBody()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync(EndpointPath);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        LlmMonthlyTenantDollarBudgetStatusResult? body =
            await response.Content.ReadFromJsonAsync<LlmMonthlyTenantDollarBudgetStatusResult>(JsonOptions);

        body.Should().NotBeNull();
        body!.UtcMonth.Should().NotBeNullOrWhiteSpace();
    }
}
