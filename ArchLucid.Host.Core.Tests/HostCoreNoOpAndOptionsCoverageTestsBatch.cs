using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCoreNoOpAndOptionsCoverageTestsBatch
{
    [Fact]
    public async Task NullIntegrationEventPublisher_completes_all_publish_overloads()
    {
        NullIntegrationEventPublisher sut = NullIntegrationEventPublisher.Instance;
        byte[] payload = "payload"u8.ToArray();

        await sut.Invoking(s => s.PublishAsync("evt", payload, CancellationToken.None)).Should().NotThrowAsync();
        await sut.Invoking(s => s.PublishAsync("evt", payload, "msg-id", CancellationToken.None)).Should().NotThrowAsync();
        await sut.Invoking(
                s => s.PublishAsync(
                    "evt",
                    payload,
                    "msg-id",
                    new Dictionary<string, object> { ["k"] = "v" },
                    CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NoOpScimUserRepository_returns_empty_read_results()
    {
        NoOpScimUserRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        (await sut.ListAsync(tenantId, filter: null, startIndex1Based: 1, count: 10, CancellationToken.None))
            .items
            .Should()
            .BeEmpty();
        (await sut.GetByIdAsync(tenantId, Guid.NewGuid(), CancellationToken.None)).Should().BeNull();
        (await sut.GetByExternalIdAsync(tenantId, "ext", CancellationToken.None)).Should().BeNull();
        (await sut.ListGroupKeysForUserAsync(tenantId, Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpScimUserRepository_mutators_throw_not_supported()
    {
        NoOpScimUserRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        Func<Task> insert = () => sut.InsertAsync(
            tenantId,
            "ext",
            "user",
            displayName: null,
            active: true,
            resolvedRole: null,
            resolvedRoleOrigin: default,
            CancellationToken.None);

        await insert.Should().ThrowAsync<NotSupportedException>();
    }

    [Fact]
    public async Task NoOpCustomRolePermissionEvaluator_returns_empty_permissions()
    {
        NoOpCustomRolePermissionEvaluator sut = new();

        IReadOnlyList<string> permissions =
            await sut.GetEffectivePermissionsAsync(Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None);

        permissions.Should().BeEmpty();
    }

    [Fact]
    public void WebhookDeliveryOptions_exposes_section_name_and_defaults()
    {
        WebhookDeliveryOptions options = new();

        WebhookDeliveryOptions.SectionName.Should().Be("WebhookDelivery");
        options.UseHttpClient.Should().BeFalse();
        options.UseCloudEventsEnvelope.Should().BeFalse();
    }

    [Fact]
    public void BackgroundJobsOptions_exposes_section_name_and_defaults()
    {
        BackgroundJobsOptions options = new();

        BackgroundJobsOptions.SectionName.Should().Be("BackgroundJobs");
        options.Mode.Should().Be("InMemory");
        options.QueueName.Should().Be("archlucid-export-jobs");
        options.MaxPendingJobs.Should().Be(500);
        options.ProcessorReceiveBatchSize.Should().Be(16);
        options.ProcessorIdlePollMilliseconds.Should().Be(750);
        options.ProcessorMaxIdlePollMilliseconds.Should().BeNull();
    }

    [Fact]
    public void ObservabilityHostOptions_exposes_section_name_and_nested_defaults()
    {
        ObservabilityHostOptions options = new();

        ObservabilityHostOptions.SectionName.Should().Be("Observability");
        options.Prometheus.ScrapePath.Should().Be("/metrics");
        options.Prometheus.RequireScrapeAuthentication.Should().BeTrue();
    }

    [Fact]
    public void ReplayDiagnosticsOptions_exposes_defaults()
    {
        ReplayDiagnosticsOptions options = new();

        ReplayDiagnosticsOptions.SectionName.Should().Be("ReplayDiagnostics");
        options.MaxRetainedRecords.Should().Be(100);
        options.RetentionMinutes.Should().Be(1440);
    }

    [Fact]
    public void ApiDeprecationOptions_exposes_defaults()
    {
        ApiDeprecationOptions options = new();

        ApiDeprecationOptions.SectionName.Should().Be("ApiDeprecation");
        options.Enabled.Should().BeFalse();
    }
}
