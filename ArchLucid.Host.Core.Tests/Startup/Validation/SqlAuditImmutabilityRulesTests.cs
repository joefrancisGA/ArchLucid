using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

[Trait("Category", "Unit")]
public sealed class SqlAuditImmutabilityRulesTests
{
    [SkippableFact]
    public void ShouldValidate_when_development_and_sql_returns_false()
    {
        Dictionary<string, string?> settings = new() { ["ArchLucid:StorageProvider"] = "Sql" };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestHostEnvironment environment = new(Environments.Development);

        bool result = SqlAuditImmutabilityRules.ShouldValidate(environment, configuration, new ArchLucidOptions { StorageProvider = "Sql" });

        result.Should().BeFalse();
    }

    [SkippableFact]
    public void ShouldValidate_when_production_and_sql_returns_true()
    {
        Dictionary<string, string?> settings = new() { ["ArchLucid:StorageProvider"] = "Sql" };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestHostEnvironment environment = new(Environments.Production);

        bool result = SqlAuditImmutabilityRules.ShouldValidate(environment, configuration, new ArchLucidOptions { StorageProvider = "Sql" });

        result.Should().BeTrue();
    }

    [SkippableFact]
    public void ResolveAuditCatalogConnectionString_single_catalog_uses_archlucid_connection()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] = "Server=sql.example;Database=ArchLucid;Encrypt=True",
            ["ArchLucid:SqlTopology:Mode"] = "SingleCatalog"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();

        string? connectionString = SqlAuditImmutabilityRules.ResolveAuditCatalogConnectionString(configuration);

        connectionString.Should().Contain("Initial Catalog=ArchLucid");
        connectionString.Should().Contain("sql.example");
    }

    [SkippableFact]
    public void ResolveAuditCatalogConnectionString_per_tenant_uses_development_tenant_connection()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ConnectionStrings:ArchLucid"] = "Server=sql.example;Database=System;Encrypt=True",
            ["ArchLucid:SqlTopology:Mode"] = "SystemWithPerTenantCatalogs",
            ["ArchLucid:SqlTopology:DevelopmentTenantConnectionString"] = "Server=sql.example;Database=TenantTemplate;Encrypt=True"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();

        string? connectionString = SqlAuditImmutabilityRules.ResolveAuditCatalogConnectionString(configuration);

        connectionString.Should().NotBeNullOrWhiteSpace();
        connectionString.Should().Contain("TenantTemplate");
    }

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
