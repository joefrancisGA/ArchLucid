using System.Net;
using System.Net.Http.Json;

using ArchLucid.Core.ProductLine;
using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Tests;

/// <summary>OP-04 HTTP coverage using <see cref="OpenApiContractWebAppFactory" /> and DevelopmentBypass.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class ProductLineRouteGateIntegrationTests
{
    [Fact]
    public async Task Security_product_line_header_blocks_architecture_route_but_not_both_route()
    {
        await using OpenApiContractWebAppFactory factory = new();
        using HttpClient client = factory.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        client.DefaultRequestHeaders.Add(ProductLineHttpHeaderNames.Header, "security");

        HttpResponseMessage architectureResponse = await client.GetAsync("/v1/architecture/model-engine-selection-options");
        architectureResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        Microsoft.AspNetCore.Mvc.ProblemDetails? architectureProblem =
            await architectureResponse.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ProblemDetails>();
        architectureProblem.Should().NotBeNull();
        architectureProblem!.Status.Should().Be(StatusCodes.Status403Forbidden);

        HttpResponseMessage findingsResponse = await client.GetAsync("/v1/findings/missing-finding-id/inspect");
        findingsResponse.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Architecture_effective_line_without_header_still_reaches_architecture_route()
    {
        await using OpenApiContractWebAppFactory factory = new();
        using HttpClient client = factory.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        HttpResponseMessage response = await client.GetAsync("/v1/architecture/model-engine-selection-options");

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Health_endpoint_skips_product_line_gate()
    {
        await using OpenApiContractWebAppFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/health/live");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
