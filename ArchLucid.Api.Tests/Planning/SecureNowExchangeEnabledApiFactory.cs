using ArchLucid.Api.Security;
using ArchLucid.Api.Tests;
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
    private readonly SeededTestEvidenceEntitlementAuthority _testEntitlements = new();

    public void GrantSeededTestRun(Guid runId) => _testEntitlements.Allow(runId);

    public string TestEntitlementDiagnosticCounts => _testEntitlements.DiagnosticCounts;

  public SecureNowExchangeEnabledApiFactory() : base(sqlAuthorityStorage: true) { }

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