using System.Net;
using System.Net.Http.Json;
using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Core.Configuration;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests.Planning;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class SecureNowEnabledPersistedHttpTests(SecureNowExchangeEnabledApiFactory factory)
    : IClassFixture<SecureNowExchangeEnabledApiFactory>
{
    [SkippableFact]
    public async Task Persisted_owner_receives_200_and_foreign_tenant_receives_404_with_exchange_enabled()
    {
        using HttpClient owner = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(owner);
        Guid run = await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(
            factory.Services, CancellationToken.None, pinTemporalSnapshotChain: true);
        // The production entitlement service intentionally denies all reads.
        // This host-only server-side test ACL grants the exact seeded run.
        factory.GrantSeededTestRun(run);

        // Prove the real scoped SQL query sees the persisted graph on Runs,
        // not merely a separately stored GraphSnapshots row. This exact
        // query is what the HTTP temporal resolver uses before authorization
        // of the resolved run; a false-negative seed must fail here.
        using (IServiceScope seededScope = factory.Services.CreateScope())
        {
            IRunRepository runs =
                seededScope.ServiceProvider.GetRequiredService<IRunRepository>();
            ScopeContext ownerScope = new()
            {
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject
            };
            RunRecord? pinned = await runs.GetByIdAsync(
                ownerScope, run, CancellationToken.None);
            pinned.Should().NotBeNull();
            pinned!.GraphSnapshotId.Should().NotBeNull(
                because: "the temporal query filters Runs.GraphSnapshotId IS NOT NULL");
            RunRecord? resolved = await runs.GetLatestWithGraphAtOrBeforeAsync(
                ownerScope, pinned.ProjectId, DateTime.UtcNow.AddMinutes(1),
                CancellationToken.None);
            resolved.Should().NotBeNull(
                because: "the seeded run must meet the SQL temporal graph predicate");
            resolved!.RunId.Should().Be(run);
        }

        string url = $"/v1/evidence-graph/snapshot?runId={run:D}"
            + $"&asOf={Uri.EscapeDataString(DateTimeOffset.UtcNow.AddMinutes(1).ToString("O"))}"
            + "&secureNowExchange=true";

        // Validate feature visibility independently before exercising the HTTP
        // authorization and temporal resolver chain. Neither this assertion
        // nor the diagnostic response body changes a production security gate.
        bool featureEnabled = await factory.Services.GetRequiredService<IFeatureFlags>()
            .IsEnabledAsync("SecureNow.ReadOnlySnapshotExchange", CancellationToken.None);
        featureEnabled.Should().BeTrue(
            because: "the exchange is enabled only for this isolated integration host");

        // Separate the ordinary persisted graph/temporal resolver from the
        // opt-in exchange authorization. Both are read-only operations.
        string ordinaryUrl = url.Replace("&secureNowExchange=true", "", StringComparison.Ordinal);
        using HttpResponseMessage ordinary = await owner.GetAsync(ordinaryUrl);
        string ordinaryBody = await ordinary.Content.ReadAsStringAsync();

        using HttpResponseMessage allowed = await owner.GetAsync(url);
        string responseBody = await allowed.Content.ReadAsStringAsync();
        allowed.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "a seeded, authorized run must support an owner snapshot read; ordinary GET status/body: {0}/{1}; exchange response: {2}; test-host ACL: {3}",
            ordinary.StatusCode, ordinaryBody, responseBody, factory.TestEntitlementDiagnosticCounts);
        SecureNowSnapshotEnvelope? envelope =
            await allowed.Content.ReadFromJsonAsync<SecureNowSnapshotEnvelope>();
        envelope.Should().NotBeNull();
        envelope!.RunId.Should().Be(run);
        envelope.TenantId.Should().Be(ScopeIds.DefaultTenant);
        envelope.ReadOnly.Should().BeTrue();

        GreenfieldIntegrationTenantScope.Scope foreignScope =
            GreenfieldIntegrationTenantScope.CreateUniqueScope();
        await GreenfieldIntegrationTenantScope.EnsureScopeAsync(
            factory.SqlConnectionString, foreignScope);
        using HttpClient outsider = factory.CreateClient();
        GreenfieldIntegrationTenantScope.WireScope(outsider, foreignScope);

        using HttpResponseMessage denied = await outsider.GetAsync(url);
        denied.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
