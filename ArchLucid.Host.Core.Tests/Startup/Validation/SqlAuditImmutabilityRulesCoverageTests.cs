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
public sealed class SqlAuditImmutabilityRulesCoverageTests
{
    [Fact]
    public void ShouldValidate_is_false_for_in_memory_storage()
    {
        TestHostEnvironment environment = new() { EnvironmentName = Environments.Production };
        IConfiguration configuration = new ConfigurationBuilder().Build();
        ArchLucidOptions options = new() { StorageProvider = "InMemory" };

        SqlAuditImmutabilityRules.ShouldValidate(environment, configuration, options).Should().BeFalse();
    }

    [Fact]
    public void ShouldValidate_is_true_for_sql_in_production_like_host()
    {
        TestHostEnvironment environment = new() { EnvironmentName = Environments.Production };
        IConfiguration configuration = new ConfigurationBuilder().Build();
        ArchLucidOptions options = new() { StorageProvider = "Sql" };

        SqlAuditImmutabilityRules.ShouldValidate(environment, configuration, options).Should().BeTrue();
    }

    [Fact]
    public void ResolveAuditCatalogConnectionString_uses_development_tenant_connection_for_catalog_topology()
    {
        const string tenantConnection = "Server=.;Database=tenant;";
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucid:SqlTopology:Mode"] = nameof(SqlTopologyMode.SystemWithPerTenantCatalogs),
            ["ArchLucid:SqlTopology:DevelopmentTenantConnectionString"] = tenantConnection,
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();

        string? resolved = SqlAuditImmutabilityRules.ResolveAuditCatalogConnectionString(configuration);

        resolved.Should().Be(tenantConnection);
    }

    [Fact]
    public void ResolveAuditCatalogConnectionString_falls_back_to_archlucid_connection_string()
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
