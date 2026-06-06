using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

[Trait("Category", "Unit")]
public sealed class SqlSealedEvidenceImmutabilityRulesTests
{
    [SkippableFact]
    public void ShouldValidate_when_development_and_sql_returns_false()
    {
        Dictionary<string, string?> settings = new() { ["ArchLucid:StorageProvider"] = "Sql" };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestHostEnvironment environment = new(Environments.Development);

        bool result = SqlSealedEvidenceImmutabilityRules.ShouldValidate(
            environment,
            configuration,
            new ArchLucidOptions { StorageProvider = "Sql" });

        result.Should().BeFalse();
    }

    [SkippableFact]
    public void ShouldValidate_when_production_and_sql_returns_true()
    {
        Dictionary<string, string?> settings = new() { ["ArchLucid:StorageProvider"] = "Sql" };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestHostEnvironment environment = new(Environments.Production);

        bool result = SqlSealedEvidenceImmutabilityRules.ShouldValidate(
            environment,
            configuration,
            new ArchLucidOptions { StorageProvider = "Sql" });

        result.Should().BeTrue();
    }

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
