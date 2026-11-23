using ArchLucid.Api.Security;
using ArchLucid.Api.Tests;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Api.Tests.Planning;

/// <summary>Isolated host enables exchange solely in this test process.</summary>
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

