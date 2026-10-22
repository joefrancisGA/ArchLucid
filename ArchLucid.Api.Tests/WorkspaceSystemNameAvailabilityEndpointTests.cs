using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/architecture/workspace-system-name-availability</c>.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class WorkspaceSystemNameAvailabilityEndpointTests
{
    private const string EndpointPath = "/v1/architecture/workspace-system-name-availability";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Get_WithEmptySystemName_Returns200_Available()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync($"{EndpointPath}?systemName=");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        WorkspaceSystemNameAvailabilityResponse? body =
            await response.Content.ReadFromJsonAsync<WorkspaceSystemNameAvailabilityResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.IsAvailable.Should().BeTrue();
        body.ConflictMessage.Should().BeNull();
    }

    [SkippableFact]
    public async Task Get_WithUnusedSystemName_Returns200_Available()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        string uniqueName = $"Unique-System-{Guid.NewGuid():N}";
        using HttpResponseMessage response = await client.GetAsync(
            $"{EndpointPath}?systemName={Uri.EscapeDataString(uniqueName)}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        WorkspaceSystemNameAvailabilityResponse? body =
            await response.Content.ReadFromJsonAsync<WorkspaceSystemNameAvailabilityResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.SystemName.Should().Be(uniqueName);
        body.IsAvailable.Should().BeTrue();
        body.ConflictMessage.Should().BeNull();
    }
}
