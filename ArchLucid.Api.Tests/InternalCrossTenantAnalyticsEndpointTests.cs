using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models.Analytics;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/internal/analytics/cross-tenant</c> (operator RBAC).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class InternalCrossTenantAnalyticsEndpointTests
{
    [Fact]
    public async Task GetCrossTenant_returns_ok_with_numeric_shape()
    {
        await using OperatorRoleArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/v1/internal/analytics/cross-tenant");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        InternalCrossTenantAnalyticsResponse? body =
            await response.Content.ReadFromJsonAsync<InternalCrossTenantAnalyticsResponse>(
                new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web)
                {
                    PropertyNameCaseInsensitive = true,
                });

        body.Should().NotBeNull();
        body!.CatalogsAggregated.Should().BeGreaterThanOrEqualTo(0);
        body.TotalRunsNonArchived.Should().BeGreaterThanOrEqualTo(0);
        body.TotalCompletedRuns.Should().BeGreaterThanOrEqualTo(0);
    }
}
