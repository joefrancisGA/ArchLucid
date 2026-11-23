using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Security;
using ArchLucid.Core.Scoping;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Api.Tests.Planning;

/// <summary>
/// Isolated API factory enables the SecureNow exchange only inside this test host.
/// Production feature configuration is untouched.
/// </summary>
public sealed class SecureNowExchangeEnabledApiFactory : ArchLucidApiFactory
{
    // A real host has a deny-all evidence entitlement authority until a trusted
    // issuer is deployed. Only this isolated fixture knows the seeded run ID.
    // Do not replace the central authorization service or the production default.
    private readonly SeededTestEvidenceEntitlementAuthority _testEntitlements = new();

    public void GrantSeededTestRun(Guid runId) => _testEntitlements.Allow(runId);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IEvidenceEntitlementAuthority>();
            services.AddSingleton<IEvidenceEntitlementAuthority>(_testEntitlements);
        });
    }

    protected override void ApplySqlCatalogCustomSettings(Dictionary<string, string?> settings)
    {
        base.ApplySqlCatalogCustomSettings(settings);
        settings["FeatureManagement:SecureNow.ReadOnlySnapshotExchange"] = "true";
    }
}

/// <summary>
/// Explicit test-only current ACL: no unseeded run, foreign scope or anonymous
/// principal receives a resource grant. No client header can add a grant.
/// </summary>
internal sealed class SeededTestEvidenceEntitlementAuthority : IEvidenceEntitlementAuthority
{
    private readonly ConcurrentDictionary<Guid, byte> _seededRuns = new();

    public void Allow(Guid runId)
    {
        if (runId == Guid.Empty)
            throw new ArgumentException("A seeded run ID is required.", nameof(runId));
        _seededRuns.TryAdd(runId, 0);
    }

    public Task<bool> HasCurrentReadEntitlementAsync(
        ClaimsPrincipal principal, EvidenceReadResource resource, CancellationToken cancellationToken)
    {
        bool allowed = principal.Identity?.IsAuthenticated == true
            && resource.TenantId == ScopeIds.DefaultTenant
            && resource.WorkspaceId == ScopeIds.DefaultWorkspace
            && resource.ProjectId == ScopeIds.DefaultProject
            && _seededRuns.ContainsKey(resource.EvidenceId);
        return Task.FromResult(allowed);
    }
}

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
            factory.Services, CancellationToken.None);
        // The production entitlement service intentionally denies all reads.
        // This host-only server-side test ACL grants the exact seeded run.
        factory.GrantSeededTestRun(run);
        string url = $"/v1/evidence-graph/snapshot?runId={run:D}"
            + $"&asOf={Uri.EscapeDataString(DateTimeOffset.UtcNow.AddMinutes(1).ToString("O"))}"
            + "&secureNowExchange=true";

        using HttpResponseMessage allowed = await owner.GetAsync(url);
        allowed.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "the seeded sealed-manifest authority chain must support an authorized snapshot read");
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
