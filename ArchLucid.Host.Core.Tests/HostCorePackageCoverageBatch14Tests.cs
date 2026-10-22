using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Health;
using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Notifications;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch14Tests
{
    [Fact]
    public void OperationalDetailedHealthChecks_includes_core_registration_names()
    {
        OperationalDetailedHealthChecks.IsIncluded(OperationalDetailedHealthChecks.CircuitBreakers).Should().BeTrue();
        OperationalDetailedHealthChecks.IsIncluded(OperationalDetailedHealthChecks.Database).Should().BeTrue();
        OperationalDetailedHealthChecks.IsIncluded(OperationalDetailedHealthChecks.DistributedCache).Should().BeTrue();
        OperationalDetailedHealthChecks.IsIncluded(OperationalDetailedHealthChecks.Orchestrator).Should().BeTrue();
        OperationalDetailedHealthChecks.IsIncluded("unknown-check").Should().BeFalse();
    }

    [Fact]
    public void EmbeddedContentPaths_and_readiness_tags_expose_stable_tokens()
    {
        EmbeddedContentPaths.ComplianceRulePackRelativePath.Should().Contain("default-compliance.rules.json");
        EmbeddedContentPaths.GaStarterComplianceRulePackRelativePath.Should().Contain("ga-starter-compliance.rules.json");
        ReadinessTags.Live.Should().Be("live");
        ReadinessTags.Ready.Should().Be("ready");
        ProblemDocumentationLinks.QualityGateRejectionRunbookRelativePath.Should().Contain("QUALITY_GATE_REJECTION.md");
        ProblemDocumentationLinks.RunbookExtensionKey.Should().Be("runbook");
    }

    [Fact]
    public void DemoScopes_builds_pinned_default_scope()
    {
        ScopeContext scope = DemoScopes.BuildDemoScope();

        scope.TenantId.Should().Be(ScopeIds.DefaultTenant);
        scope.WorkspaceId.Should().Be(ScopeIds.DefaultWorkspace);
        scope.ProjectId.Should().Be(ScopeIds.DefaultProject);
    }

    [Fact]
    public void ArchLucidConfigurationBridge_resolves_sql_and_product_options()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [HostDefaults.EnvironmentKey] = Environments.Production,
                ["ConnectionStrings:ArchLucid"] = "Server=.;Database=arch;Encrypt=False;TrustServerCertificate=True",
                ["ConnectionStrings:ArchLucidSystem"] = "Server=.;Database=system;Encrypt=False;TrustServerCertificate=True",
                ["ArchLucid:StorageProvider"] = "Sql",
            })
            .Build();

        ArchLucidConfigurationBridge.ShouldEnforceSqlServerCertificateTrust(configuration).Should().BeTrue();

        string? sql = ArchLucidConfigurationBridge.ResolveSqlConnectionString(configuration);
        string? systemSql = ArchLucidConfigurationBridge.ResolveSqlSystemConnectionString(configuration);
        ArchLucidOptions options = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        sql.Should().Contain("Encrypt=True");
        systemSql.Should().Contain("Encrypt=True");
        options.StorageProvider.Should().Be("Sql");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ArchLucidConfigurationBridge_treats_blank_sql_connection_strings_as_missing(string blankConnectionString)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucid"] = blankConnectionString,
                ["ConnectionStrings:ArchLucidSystem"] = blankConnectionString,
            })
            .Build();

        ArchLucidConfigurationBridge.ResolveSqlConnectionString(configuration).Should().BeNull();
        ArchLucidConfigurationBridge.ResolveSqlSystemConnectionString(configuration).Should().BeNull();
    }

    [Fact]
    public void ContentSafetyConfigurationWarnings_logs_when_fail_open_in_production()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucid:ContentSafety:FailClosedOnSdkError"] = "false",
            })
            .Build();
        IHostEnvironment production = new TestHostEnvironment { EnvironmentName = Environments.Production };
        TestLogger logger = new();

        ContentSafetyConfigurationWarnings.LogIfProductionLikeFailOpenSdkSettingIsIgnored(
            configuration,
            production,
            logger);

        logger.Messages.Should().ContainSingle(message =>
            message.Contains("FailClosedOnSdkError", StringComparison.Ordinal));
    }

    [Fact]
    public void ContentSafetyConfigurationWarnings_skips_when_fail_closed_or_development()
    {
        IConfiguration failClosed = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ArchLucid:ContentSafety:FailClosedOnSdkError"] = "true" })
            .Build();
        IHostEnvironment production = new TestHostEnvironment { EnvironmentName = Environments.Production };
        TestLogger logger = new();

        ContentSafetyConfigurationWarnings.LogIfProductionLikeFailOpenSdkSettingIsIgnored(
            failClosed,
            production,
            logger);

        logger.Messages.Should().BeEmpty();

        IConfiguration failOpen = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ArchLucid:ContentSafety:FailClosedOnSdkError"] = "false" })
            .Build();
        IHostEnvironment development = new TestHostEnvironment { EnvironmentName = Environments.Development };

        ContentSafetyConfigurationWarnings.LogIfProductionLikeFailOpenSdkSettingIsIgnored(
            failOpen,
            development,
            logger);

        logger.Messages.Should().BeEmpty();
    }

    [Fact]
    public async Task ProcessTempDirectoryHealthCheck_reports_writable_temp_directory()
    {
        ProcessTempDirectoryHealthCheck sut = new();

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("writable");
    }

    [Fact]
    public async Task RunGoldenManifestConsistencyHealthCheck_skips_for_in_memory_storage()
    {
        Mock<IDbConnectionFactory> connectionFactory = new();
        IOptions<ArchLucidOptions> options = Options.Create(new ArchLucidOptions { StorageProvider = "InMemory" });
        RunGoldenManifestConsistencyHealthCheck sut = new(connectionFactory.Object, options);

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("InMemory");
        connectionFactory.Verify(
            f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CloudEventsWrappingWebhookPoster_wraps_payload_when_enabled()
    {
        Mock<IWebhookPoster> inner = new();
        inner
            .Setup(p => p.PostJsonAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>(), null))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<WebhookDeliveryOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new WebhookDeliveryOptions
        {
            UseCloudEventsEnvelope = true,
            CloudEventsSource = "/custom/source",
            CloudEventsType = "com.example.event",
        });

        CloudEventsWrappingWebhookPoster sut = new(options.Object, inner.Object);
        object payload = new { runId = "run-1", status = "Committed" };

        await sut.PostJsonAsync("https://hooks.example/notify", payload, CancellationToken.None);

        inner.Verify(
            p => p.PostJsonAsync(
                "https://hooks.example/notify",
                It.Is<object>(body => body.GetType().Name == "CloudEventV10"),
                It.IsAny<CancellationToken>(),
                null),
            Times.Once);
    }

    [Fact]
    public async Task CloudEventsWrappingWebhookPoster_delegates_without_envelope_when_disabled()
    {
        Mock<IWebhookPoster> inner = new();
        inner
            .Setup(p => p.PostJsonAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>(), null))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<WebhookDeliveryOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new WebhookDeliveryOptions { UseCloudEventsEnvelope = false });

        CloudEventsWrappingWebhookPoster sut = new(options.Object, inner.Object);
        object payload = new { ok = true };

        await sut.PostJsonAsync("https://hooks.example/notify", payload, CancellationToken.None);

        inner.Verify(
            p => p.PostJsonAsync("https://hooks.example/notify", payload, It.IsAny<CancellationToken>(), null),
            Times.Once);
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

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class NullDisposable : IDisposable
    {
        public static readonly NullDisposable Instance = new();

        public void Dispose()
        {
        }
    }
}
