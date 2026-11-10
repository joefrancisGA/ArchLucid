using System.Net;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>POST /v1/findings/{findingId}/mute</c> (ExecuteAuthority).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Trait(HarnessGoldenPathGuardConstants.DemoBaselineTraitCategory, HarnessGoldenPathGuardConstants.DemoBaselineTraitValue)]
public sealed class FindingMuteEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    /// <summary>In-memory storage has no relational <c>FindingRecords</c> rows; mute updates return 404.</summary>
    [SkippableFact]
    public async Task PostMute_when_in_memory_storage_returns_404_even_after_seed()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        FindingMuteRequest body = new()
        {
            RunId = HarnessDemoBaselineSupport.AuthorityRunId,
            Reason = "Integration test mute reason."
        };

        HttpResponseMessage response = await Client.PostAsync(
            $"/v1/findings/{HarnessDemoBaselineSupport.DemoPrimaryFindingId}/mute",
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostMute_when_body_missing_returns_400()
    {
        HttpResponseMessage response =
            await Client.PostAsync($"/v1/findings/{HarnessDemoBaselineSupport.DemoPrimaryFindingId}/mute", null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task PostMute_when_role_outside_execute_authority_returns_403()
    {
        await using NoExecuteAuthorityRoleApiFactory restrictedFactory = new();

        using HttpClient client = restrictedFactory.CreateClient();

        WireDefaultSqlIntegrationScopeHeaders(client);

        FindingMuteRequest body = new()
        {
            RunId = HarnessDemoBaselineSupport.AuthorityRunId,
            Reason = "Should not persist."
        };

        HttpResponseMessage response = await client.PostAsync(
            $"/v1/findings/{HarnessDemoBaselineSupport.DemoPrimaryFindingId}/mute",
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private sealed class NoExecuteAuthorityRoleApiFactory : ArchLucidApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);

            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                new Dictionary<string, string?> { ["ArchLucidAuth:DevRole"] = "GuestNoRead" }));
        }
    }
}
