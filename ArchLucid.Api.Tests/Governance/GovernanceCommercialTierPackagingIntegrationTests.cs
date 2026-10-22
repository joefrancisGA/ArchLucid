using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.Security;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Governance;

/// <summary>
///     Commercial tier packaging for Operate governance routes (Improvement #12).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class GovernanceCommercialTierPackagingIntegrationTests : IDisposable
{
    private readonly ArchLucidApiFactory _factory = new();

    public void Dispose()
    {
        _factory.Dispose();
    }

    [SkippableFact]
    public async Task Get_governance_dashboard_requires_standard_tier_free_returns_403_then_standard_returns_200()
    {
        HttpClient client = _factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        await CommercialTierIntegrationTestTenant.SetDefaultScopedTenantTierAsync(_factory, TenantTier.Free);

        using (HttpResponseMessage free = await client.GetAsync("/v1/governance/dashboard"))
        {
            free.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        await CommercialTierIntegrationTestTenant.SetDefaultScopedTenantTierAsync(_factory, TenantTier.Standard);

        using (HttpResponseMessage std = await client.GetAsync("/v1/governance/dashboard"))
        {
            std.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }

    [SkippableFact]
    public async Task Post_governance_approval_request_requires_execute_authority_reader_returns_403()
    {
        await using ApiKeyReaderAndAdminArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestReaderApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        await CommercialTierIntegrationTestTenant.SetDefaultScopedTenantTierAsync(factory, TenantTier.Standard);

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/governance/approval-requests",
            new { runId = "00000000000000000000000000000000", rationale = "tier-policy test" });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
            "Reader API keys must not create governance approval requests (ExecuteAuthority).");
    }
}
