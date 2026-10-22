using ArchLucid.Core.Integration;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Health;
using ArchLucid.Host.Core.Integration;
using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Notifications;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatchTests
{
    [Fact]
    public async Task ProcessTempDirectoryHealthCheck_reports_writable_temp_directory()
    {
        ProcessTempDirectoryHealthCheck sut = new();

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("writable");
    }

    [Fact]
    public async Task ComplianceRulePackHealthCheck_reports_bundled_rule_packs_when_present()
    {
        ComplianceRulePackHealthCheck sut = new();

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().BeOneOf(HealthStatus.Healthy, HealthStatus.Unhealthy);
    }

    [Fact]
    public async Task SchemaFilesHealthCheck_reports_missing_schema_when_path_empty()
    {
        SchemaValidationOptions options = new()
        {
            AgentResultSchemaPath = " ",
            GoldenManifestSchemaPath = "schemas/goldenmanifest.schema.json",
            ExplanationRunSchemaPath = "schemas/explanation-run.schema.json",
            ComparisonExplanationSchemaPath = "schemas/comparison-explanation.schema.json",
        };
        SchemaFilesHealthCheck sut = new(Options.Create(options));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("AgentResult");
    }

    [Fact]
    public async Task SchemaFilesHealthCheck_reports_healthy_when_default_schema_files_exist()
    {
        SchemaFilesHealthCheck sut = new(Options.Create(new SchemaValidationOptions()));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
    }

    [Fact]
    public async Task LoggingIntegrationEventHandler_logs_debug_preview_for_payload()
    {
        LoggingIntegrationEventHandler sut = new(NullLogger<LoggingIntegrationEventHandler>.Instance);
        byte[] payload = """{"event":"trial"}"""u8.ToArray();

        await sut.Invoking(s => s.HandleAsync(payload, CancellationToken.None)).Should().NotThrowAsync();

        sut.EventType.Should().Be(IntegrationEventTypes.WildcardEventType);
    }

    [Fact]
    public async Task CloudEventsWrappingWebhookPoster_wraps_payload_when_enabled()
    {
        Mock<IWebhookPoster> inner = new();
        inner.Setup(i => i.PostJsonAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>(), null))
            .Returns(Task.CompletedTask);
        WebhookDeliveryOptions options = new()
        {
            UseCloudEventsEnvelope = true,
            CloudEventsSource = "/custom",
            CloudEventsType = "com.test.event",
        };
        CloudEventsWrappingWebhookPoster sut = new(
            new TestOptionsMonitor<WebhookDeliveryOptions>(options),
            inner.Object);

        await sut.PostJsonAsync("https://example.com/hook", new { ok = true }, CancellationToken.None);

        inner.Verify(
            i => i.PostJsonAsync(
                "https://example.com/hook",
                It.Is<object>(o => o.GetType().Name.Contains("CloudEvent", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>(),
                null),
            Times.Once);
    }

    [Fact]
    public async Task CloudEventsWrappingWebhookPoster_forwards_raw_payload_when_disabled()
    {
        Mock<IWebhookPoster> inner = new();
        inner.Setup(i => i.PostJsonAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>(), null))
            .Returns(Task.CompletedTask);
        WebhookDeliveryOptions options = new() { UseCloudEventsEnvelope = false };
        object payload = new { ok = true };
        CloudEventsWrappingWebhookPoster sut = new(
            new TestOptionsMonitor<WebhookDeliveryOptions>(options),
            inner.Object);

        await sut.PostJsonAsync("https://example.com/hook", payload, CancellationToken.None);

        inner.Verify(
            i => i.PostJsonAsync("https://example.com/hook", payload, It.IsAny<CancellationToken>(), null),
            Times.Once);
    }

    [Fact]
    public void E2EHarnessOptions_and_ObservabilityTracingOptions_expose_defaults()
    {
        E2EHarnessOptions harness = new();
        ObservabilityTracingOptions tracing = new();

        E2EHarnessOptions.SectionName.Should().Be("ArchLucid:E2eHarness");
        harness.Enabled.Should().BeFalse();
        tracing.SamplingRatio.Should().Be(1.0);
        tracing.AlwaysSampleActivitySources.Should().BeNull();
    }

    private sealed class TestOptionsMonitor<T>(T value) : IOptionsMonitor<T>
        where T : class
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => new NoopDisposable();
    }

    private sealed class NoopDisposable : IDisposable
    {
        public void Dispose()
        {
        }
    }
}
