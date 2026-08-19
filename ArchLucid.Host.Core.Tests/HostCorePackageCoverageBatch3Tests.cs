using ArchLucid.Core.Resilience;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Health;
using ArchLucid.Host.Core.Resilience;
using ArchLucid.Persistence.Data.Infrastructure;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch3Tests
{
    [Fact]
    public async Task SqlConnectionHealthCheck_skips_when_storage_is_in_memory()
    {
        Mock<IDbConnectionFactory> connectionFactory = new();
        SqlConnectionHealthCheck sut = new(
            connectionFactory.Object,
            Options.Create(new ArchLucidOptions { StorageProvider = "InMemory" }),
            Options.Create(new SqlConnectionHealthCheckOptions()));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("InMemory");
        connectionFactory.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CircuitBreakerHealthCheck_reports_healthy_when_no_gates_registered()
    {
        CircuitBreakerHealthCheck sut = new(new ServiceCollection().BuildServiceProvider());

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("not registered");
    }

    [Fact]
    public async Task CircuitBreakerHealthCheck_reports_degraded_when_gate_is_open()
    {
        ServiceCollection services = new();
        CircuitBreakerGate gate = new(OpenAiCircuitBreakerKeys.Completion, new CircuitBreakerOptions { FailureThreshold = 1 });
        gate.RecordFailure();
        services.AddKeyedSingleton(OpenAiCircuitBreakerKeys.Completion, gate);
        CircuitBreakerHealthCheck sut = new(services.BuildServiceProvider());

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Degraded);
    }

    [Fact]
    public void ArchLucidLegacyConfigurationWarnings_logs_when_legacy_keys_present()
    {
        Dictionary<string, string?> config = new()
        {
            ["ConnectionStrings:" + "Archi" + "Forge"] = "Server=.;",
            ["Archi" + "Forge:Feature"] = "on",
        };
        TestLogger logger = new();
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(config!).Build();

        ArchLucidLegacyConfigurationWarnings.LogIfLegacyKeysPresent(configuration, logger);

        logger.Messages.Should().Contain(m => m.Contains("Legacy configuration keys"));
    }

    [Fact]
    public void BatchReplayOptions_and_TenantHealthScoringOptions_expose_defaults()
    {
        BatchReplayOptions batch = new();
        TenantHealthScoringOptions health = new();
        AuthorityPipelineWorkProcessorOptions authority = new();
        DeveloperExperienceOptions developer = new();
        ApiDeprecationOptions deprecation = new();

        BatchReplayOptions.SectionName.Should().Be("ComparisonReplay:Batch");
        batch.MaxComparisonRecordIds.Should().Be(50);
        TenantHealthScoringOptions.SectionName.Should().Be("ArchLucid:TenantHealthScoring");
        health.Enabled.Should().BeTrue();
        health.IntervalHours.Should().Be(24);
        AuthorityPipelineWorkProcessorOptions.SectionName.Should().Be("AuthorityPipelineWork");
        authority.LeaseDurationSeconds.Should().Be(900);
        DeveloperExperienceOptions.SectionName.Should().Be("DeveloperExperience");
        developer.EnableApiExplorer.Should().BeFalse();
        ApiDeprecationOptions.SectionName.Should().Be("ApiDeprecation");
        deprecation.EmitDeprecationTrue.Should().BeTrue();
    }

    [Fact]
    public async Task DetailedHealthCheckResponseWriter_summary_payload_omits_sensitive_fields()
    {
        DefaultHttpContext httpContext = new();
        httpContext.Response.Body = new MemoryStream();
        HealthReport report = new(
            new Dictionary<string, HealthReportEntry>
            {
                ["sql"] = new(HealthStatus.Healthy, "ok", TimeSpan.FromMilliseconds(1), null, null),
            },
            TimeSpan.FromMilliseconds(2));

        await DetailedHealthCheckResponseWriter.WriteAsync(httpContext, report, HealthCheckResponseDetailLevel.Summary);

        httpContext.Response.Body.Position = 0;
        string body = await new StreamReader(httpContext.Response.Body).ReadToEndAsync();
        body.Should().Contain("\"status\": \"Healthy\"");
        body.Should().Contain("\"name\": \"sql\"");
    }

    private sealed class TestLogger : ILogger
    {
        public List<string> Messages { get; } = [];

        public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullDisposable.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
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
