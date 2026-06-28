using System.Net;
using System.Net.Http.Json;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>PUT /v1/findings/{findingId}/remediation-assignment</c> (TB-395).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class FindingRemediationAssignmentEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    private static string DemoPrimaryFindingId =>
        $"finding-demo-{ContosoRetailDemoIdentifiers.AuthorityRunBaselineId:N}-primary";

    private async Task EnsureDemoBaselineSeededAsync()
    {
        using IServiceScope serviceScope = Factory.Services.CreateScope();
        await serviceScope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();
    }

    [SkippableFact]
    public async Task PutRemediationAssignment_when_in_memory_storage_returns_404_even_after_seed()
    {
        await EnsureDemoBaselineSeededAsync();

        FindingRemediationAssignmentRequest body = new()
        {
            RunId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId,
            AssignedToUserId = "owner@example.com",
            RemediationDueUtc = DateTimeOffset.UtcNow.AddDays(14)
        };

        HttpResponseMessage response = await Client.PutAsJsonAsync(
            $"/v1/findings/{DemoPrimaryFindingId}/remediation-assignment",
            body,
            JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PutRemediationAssignment_when_body_missing_returns_400()
    {
        HttpResponseMessage response =
            await Client.PutAsync($"/v1/findings/{DemoPrimaryFindingId}/remediation-assignment", null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task PutRemediationAssignment_when_role_outside_execute_authority_returns_403()
    {
        await using NoExecuteAuthorityRoleApiFactory factory = new();

        using HttpClient client = factory.CreateClient();

        WireDefaultSqlIntegrationScopeHeaders(client);

        FindingRemediationAssignmentRequest body = new()
        {
            RunId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId,
            AssignedToUserId = "owner@example.com"
        };

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/v1/findings/{DemoPrimaryFindingId}/remediation-assignment",
            body,
            JsonOptions);

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
