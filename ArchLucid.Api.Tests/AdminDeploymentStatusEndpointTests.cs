using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Admin;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/admin/deployment-status</c>.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AdminDeploymentStatusEndpointTests
{
    private const string EndpointPath = "/v1/admin/deployment-status?frontendBuildId=testfrontend";

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
    public async Task Get_WithDevelopmentBypassDefaultRole_Returns200_WithUnknownSafeDefaults()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync(EndpointPath);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        AdminDeploymentStatusResponse? body =
            await response.Content.ReadFromJsonAsync<AdminDeploymentStatusResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.Environment.Should().NotBeNullOrWhiteSpace();
        body.FrontendBuildId.Should().Be("testfrontend");
        body.ComponentAgreement.Should().NotBeNullOrWhiteSpace();
        body.OverallStatus.Should().NotBeNullOrWhiteSpace();
        body.LatestSmokeTestResult.Should().Be(AdminDeploymentStatusValues.Unknown);
        body.LastKnownGoodBuildId.Should().Be(AdminDeploymentStatusValues.Unknown);
    }
}
