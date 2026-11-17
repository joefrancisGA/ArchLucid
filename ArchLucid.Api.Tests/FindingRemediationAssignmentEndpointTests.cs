using System.Net;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>PUT /v1/findings/{findingId}/remediation-assignment</c> (TB-395).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Trait(HarnessGoldenPathGuardConstants.DemoBaselineTraitCategory, HarnessGoldenPathGuardConstants.DemoBaselineTraitValue)]
public sealed class FindingRemediationAssignmentEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task PutRemediationAssignment_when_in_memory_storage_returns_404_even_after_seed()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        FindingRemediationAssignmentRequest body = new()
        {
            RunId = HarnessDemoBaselineSupport.AuthorityRunId,
            AssignedToUserId = "owner@example.com",
            RemediationDueUtc = DateTimeOffset.UtcNow.AddDays(14)
        };

        HttpResponseMessage response = await Client.PutFindingRemediationAssignmentHttpAsync(
            HarnessDemoBaselineSupport.DemoPrimaryFindingId,
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PutRemediationAssignment_when_body_missing_returns_400()
    {
        HttpResponseMessage response =
            await Client.PutFindingRemediationAssignmentHttpAsync(HarnessDemoBaselineSupport.DemoPrimaryFindingId, null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task PutRemediationAssignment_when_role_outside_execute_authority_returns_403()
    {
        await using NoExecuteAuthorityRoleApiFactory restrictedFactory = new();

        using HttpClient client = restrictedFactory.CreateClient();

        WireDefaultSqlIntegrationScopeHeaders(client);

        FindingRemediationAssignmentRequest body = new()
        {
            RunId = HarnessDemoBaselineSupport.AuthorityRunId,
            AssignedToUserId = "owner@example.com"
        };

        HttpResponseMessage response = await client.PutFindingRemediationAssignmentHttpAsync(
            HarnessDemoBaselineSupport.DemoPrimaryFindingId,
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
