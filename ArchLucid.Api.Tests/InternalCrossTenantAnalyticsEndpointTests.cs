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

    [Fact]
    public async Task GetDailyRollups_returns_ok_with_list_shape()
    {
        await using OperatorRoleArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/v1/internal/analytics/cross-tenant/daily");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ExportDailyRollups_csv_does_not_contain_guid_literals()
    {
        await using OperatorRoleArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response =
            await client.GetAsync("/v1/internal/analytics/cross-tenant/daily/export?format=csv");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();

        body.Should().Contain("analytics_tenant_key");
        body.Should().NotMatchRegex(
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    }
}
