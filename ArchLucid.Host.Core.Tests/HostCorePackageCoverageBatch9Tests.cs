using System.Security.Claims;

using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Configuration.Secrets;
using ArchLucid.Host.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch9Tests
{
    [Fact]
    public void Configuration_option_types_expose_section_names_and_defaults()
    {
        BatchReplayOptions batchReplay = new() { MaxComparisonRecordIds = 25 };
        batchReplay.MaxComparisonRecordIds.Should().Be(25);
        BatchReplayOptions.SectionName.Should().Be("ComparisonReplay:Batch");

        DeveloperExperienceOptions developerExperience = new() { EnableApiExplorer = true };
        developerExperience.EnableApiExplorer.Should().BeTrue();
        DeveloperExperienceOptions.SectionName.Should().Be("DeveloperExperience");

        ApiDeprecationOptions deprecation = new()
        {
            Enabled = true,
            EmitDeprecationTrue = false,
            SunsetHttpDate = "Wed, 01 Jan 2027 00:00:00 GMT",
            Link = "<https://docs.example/deprecation>; rel=\"deprecation\"",
        };
        deprecation.Enabled.Should().BeTrue();
        deprecation.EmitDeprecationTrue.Should().BeFalse();
        deprecation.SunsetHttpDate.Should().Contain("2027");
        ApiDeprecationOptions.SectionName.Should().Be("ApiDeprecation");
    }

    [Fact]
    public void ConfigurationHealthReport_models_probe_results()
    {
        ConfigurationHealthReport report = new()
        {
            Checks =
            [
                new ConfigurationHealthCheckResult
                {
                    Name = "sql",
                    Status = "Healthy",
                    Detail = "reachable",
                },
            ],
        };

        report.Checks.Should().ContainSingle();
        report.Checks[0].Name.Should().Be("sql");
    }

    [Fact]
    public async Task EnvironmentVariableSecretProvider_reads_configuration_keys()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["SecretA"] = "value-a" })
            .Build();

        EnvironmentVariableSecretProvider sut = new(configuration);

        (await sut.GetSecretAsync("SecretA", CancellationToken.None)).Should().Be("value-a");
        (await sut.GetSecretAsync("Missing", CancellationToken.None)).Should().BeNull();

        Action nullConfig = () => _ = new EnvironmentVariableSecretProvider(null!);
        Func<Task> blankName = () => sut.GetSecretAsync(" ", CancellationToken.None);

        nullConfig.Should().Throw<ArgumentNullException>();
        await blankName.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task NoOpRoleSyncService_is_noop_for_bearer_principal()
    {
        NoOpRoleSyncService sut = new();
        ClaimsPrincipal principal = new(new ClaimsIdentity([new Claim(ClaimTypes.Name, "user")], "test"));

        await sut.Invoking(s => s.ApplyEntraJwtAndDirectoryOverridesAsync(principal, CancellationToken.None))
            .Should()
            .NotThrowAsync();

        Action nullPrincipal = () =>
            sut.ApplyEntraJwtAndDirectoryOverridesAsync(null!, CancellationToken.None).GetAwaiter().GetResult();
        nullPrincipal.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ArchLucidLegacyConfigurationWarnings_logs_when_legacy_keys_present()
    {
        const string legacyProduct = "Archi" + "Forge";
        const string legacyAuth = "Archi" + "Forge" + "Auth";

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:" + legacyProduct] = "Server=.;Database=legacy;",
                    [legacyProduct + ":StorageProvider"] = "Sql",
                    [legacyAuth + ":Mode"] = "ApiKey",
                })
            .Build();

        TestLogger logger = new();

        ArchLucidLegacyConfigurationWarnings.LogIfLegacyKeysPresent(configuration, logger);

        logger.Messages.Should().ContainSingle(message => message.Contains("Legacy configuration keys", StringComparison.Ordinal));
        logger.Messages[0].Should().Contain("ArchLucid:*");
    }

    [Fact]
    public void ArchLucidLegacyConfigurationWarnings_skips_when_no_legacy_keys()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ArchLucid:StorageProvider"] = "Sql" })
            .Build();

        TestLogger logger = new();

        ArchLucidLegacyConfigurationWarnings.LogIfLegacyKeysPresent(configuration, logger);

        logger.Messages.Should().BeEmpty();
    }

    private sealed class TestLogger : ILogger
    {
        public List<string> Messages { get; } = [];

        public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullDisposable.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Messages.Add(formatter(state, exception));
        }
    }

    private sealed class NullDisposable : IDisposable
    {
        public static readonly NullDisposable Instance = new();

        public void Dispose()
        {
        }
    }
}
