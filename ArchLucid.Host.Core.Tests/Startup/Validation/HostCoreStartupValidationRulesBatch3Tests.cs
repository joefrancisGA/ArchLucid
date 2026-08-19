using System.Text;

using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCoreStartupValidationRulesBatch3Tests
{
    [Fact]
    public void CollectEphemeralStorageDisallowedInProductionLike_allows_in_memory_for_dev_archlucid_staging()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ARCHLUCID_ENVIRONMENT"] = "Staging",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        ArchLucidOptions options = new() { StorageProvider = "InMemory" };
        TestHostEnvironment environment = new() { EnvironmentName = Environments.Staging };
        List<string> errors = [];

        ProductionSafetyRules.CollectEphemeralStorageDisallowedInProductionLike(configuration, environment, options, errors);

        errors.Should().ContainSingle(e => e.Contains("StorageProvider=InMemory", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectEphemeralStorageDisallowedInProductionLike_skips_error_for_development_with_archlucid_staging()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ARCHLUCID_ENVIRONMENT"] = "Staging",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        ArchLucidOptions options = new() { StorageProvider = "InMemory" };
        TestHostEnvironment environment = new() { EnvironmentName = Environments.Development };
        List<string> errors = [];

        ProductionSafetyRules.CollectEphemeralStorageDisallowedInProductionLike(configuration, environment, options, errors);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void CollectTrialAuthExternalId_requires_tenant_id_when_ms_external_id_mode_enabled()
    {
        const string json = """
                            {
                              "Auth": {
                                "Trial": {
                                  "Modes": [ "MsaExternalId" ],
                                  "ExternalIdTenantId": ""
                                }
                              }
                            }
                            """;
        using MemoryStream stream = new(Encoding.UTF8.GetBytes(json));
        IConfiguration configuration = new ConfigurationBuilder().AddJsonStream(stream).Build();
        List<string> errors = [];

        ProductionSafetyRules.CollectTrialAuthExternalId(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("ExternalIdTenantId", StringComparison.Ordinal));
    }

    [Fact]
    public void ResolveAuditCatalogConnectionString_returns_null_for_per_tenant_catalog_without_dev_connection()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucid:SqlTopology:Mode"] = nameof(SqlTopologyMode.SystemWithPerTenantCatalogs),
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();

        SqlAuditImmutabilityRules.ResolveAuditCatalogConnectionString(configuration).Should().BeNull();
    }

    [Fact]
    public void ResolveAuditCatalogConnectionString_falls_back_to_normalized_archlucid_connection_string()
    {
        const string archLucidConnection = "Server=.;Database=ArchLucid;Encrypt=True";
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] = archLucidConnection,
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();

        string? resolved = SqlAuditImmutabilityRules.ResolveAuditCatalogConnectionString(configuration);

        resolved.Should().Be(ArchLucidConfigurationBridge.ResolveSqlConnectionString(configuration));
        resolved.Should().Contain("ArchLucid");
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
