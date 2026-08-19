using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

[Trait("Category", "Unit")]
public sealed class SqlCommittedRunHeaderImmutabilityRulesTests
{
    [Fact]
    public void ShouldValidate_when_development_and_sql_returns_false()
    {
        Dictionary<string, string?> settings = new() { ["ArchLucid:StorageProvider"] = "Sql" };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestHostEnvironment environment = new(Environments.Development);

        bool result = SqlCommittedRunHeaderImmutabilityRules.ShouldValidate(
            environment,
            configuration,
            new ArchLucidOptions { StorageProvider = "Sql" });

        result.Should().BeFalse();
    }

    [Fact]
    public void ShouldValidate_when_production_and_sql_returns_true()
    {
        Dictionary<string, string?> settings = new() { ["ArchLucid:StorageProvider"] = "Sql" };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestHostEnvironment environment = new(Environments.Production);

        bool result = SqlCommittedRunHeaderImmutabilityRules.ShouldValidate(
            environment,
            configuration,
            new ArchLucidOptions { StorageProvider = "Sql" });

        result.Should().BeTrue();
    }

    [SkippableFact]
    public void ValidateOrThrow_when_trigger_missing_throws()
    {
        Skip.IfNot(
            OperatingSystem.IsWindows(),
            "Implicit SQL Server fallback is Windows-only in persistence fixture conventions.");

        string? connectionString = Environment.GetEnvironmentVariable("ARCHLUCID_PERSISTENCE_SQL");

        if (string.IsNullOrWhiteSpace(connectionString))
            Skip.If(true, "Set ARCHLUCID_PERSISTENCE_SQL to run trigger-missing probe test.");

        using Microsoft.Data.SqlClient.SqlConnection connection = new(connectionString);
        connection.Open();

        if (SqlDatabaseImmutabilityProbeHelpers.TriggerExists(connection, CommittedRunHeaderAnchorRegistry.TriggerName))
            Skip.If(true, "Trigger already present; drop TR_Runs_SealCommittedHeader to test missing-trigger failure.");

        Action act = () => SqlCommittedRunHeaderImmutabilityRules.ValidateOrThrow(connectionString, NullLogger.Instance);

        act.Should().Throw<InvalidOperationException>()
            .Which.Message.Should().Contain(CommittedRunHeaderAnchorRegistry.TriggerName);
    }

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
