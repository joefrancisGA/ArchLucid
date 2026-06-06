using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

/// <summary>TB-282: cross-tenant usage rollup is operator-only, not tenant-admin.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AdminCrossTenantUsageRollupAuthorizationIntegrationTests
{
    private const string EndpointPath = "/v1/admin/analytics/cross-tenant-summary";

    [SkippableFact]
    public async Task Get_WithAdminRole_Returns403_BecauseRequireOperatorRoleIsRequired_tb282()
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
    public async Task Get_WithOperatorRole_Returns200_tb282()
    {
        await using JwtLocalSigningWebAppFactory factory = new();
        string token = factory.MintLocalBearerJwt("OperatorUser", [ArchLucidRoles.Operator]);

        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync(EndpointPath);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
