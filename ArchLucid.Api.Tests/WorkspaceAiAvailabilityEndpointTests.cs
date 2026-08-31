using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/diagnostics/workspace-ai-availability</c>.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class WorkspaceAiAvailabilityEndpointTests
{
    private const string EndpointPath = "/v1/diagnostics/workspace-ai-availability";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Get_WithDevelopmentBypassDefaultRole_Returns200_WithValidatedBody()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync(EndpointPath);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        WorkspaceAiAvailabilityResponse? body =
            await response.Content.ReadFromJsonAsync<WorkspaceAiAvailabilityResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.Validated.Should().BeTrue();
        body.AiSource.Should().NotBeNullOrWhiteSpace();
        body.Summary.Should().NotBeNullOrWhiteSpace();
        body.Checks.Should().NotBeEmpty();
    }
}
