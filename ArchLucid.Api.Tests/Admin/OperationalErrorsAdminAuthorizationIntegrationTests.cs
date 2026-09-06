using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

/// <summary>Vendor-staff internal operations inbox — not tenant Admin.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class OperationalErrorsAdminAuthorizationIntegrationTests
{
    private const string EndpointPath = "/v1/admin/operational-errors?maxRows=1";

    [SkippableFact]
    public async Task Get_WithAdminRole_Returns403_BecausePlatformInternalOperationsIsRequired()
    {
        await using JwtLocalSigningWebAppFactory factory = new();
        string token = factory.MintLocalBearerJwt("TenantAdminUser", [ArchLucidRoles.Admin]);

        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync(EndpointPath);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Get_WithPlatformOperatorRole_Returns200()
    {
        await using JwtLocalSigningWebAppFactory factory = new();
        string token = factory.MintLocalBearerJwt("PlatformOperatorUser", [ArchLucidRoles.PlatformOperator]);

        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync(EndpointPath);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
