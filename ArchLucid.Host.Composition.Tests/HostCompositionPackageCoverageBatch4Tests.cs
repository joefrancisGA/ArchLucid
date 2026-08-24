using ArchLucid.Application.Value;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.ValueReports;
using ArchLucid.Persistence.Value;

using FluentAssertions;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCompositionPackageCoverageBatch4Tests
{
    [Fact]
    public async Task InMemoryValueReportJobQueue_enqueues_polls_and_completes_job()
    {
        ServiceCollection services = new();
        Mock<IValueReportMetricsReader> metrics = new();
        metrics
            .Setup(m => m.ReadAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValueReportRawMetrics([], 1, 1, 0, 0, 0, 0, null, null, null, null, 0, null, null, null));
        services.AddSingleton(metrics.Object);
        services.AddSingleton<IOptionsMonitor<ValueReportComputationOptions>>(
            new TestOptionsMonitor<ValueReportComputationOptions>(new ValueReportComputationOptions()));
        services.AddSingleton<ValueReportBuilder>();
        Mock<IValueReportRenderer> renderer = new();
        renderer
            .Setup(r => r.RenderAsync(It.IsAny<ValueReportSnapshot>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([0x50, 0x4B, 0x03, 0x04]);
        services.AddSingleton(renderer.Object);
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        services.AddSingleton(audit.Object);
        services.AddDistributedMemoryCache();
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        IDistributedCache distributedCache = provider.GetRequiredService<IDistributedCache>();
        InMemoryValueReportJobQueue sut = new(scopeFactory, distributedCache, NullLogger<InMemoryValueReportJobQueue>.Instance);
        Guid tenantId = Guid.NewGuid();
        ValueReportJobRequest request = new(
            tenantId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(-7),
            DateTimeOffset.UtcNow);

        Guid jobId = sut.Enqueue(request);

        ValueReportJobPollResult? completed = null;

        for (int attempt = 0; attempt < 40; attempt++)
        {
            ValueReportJobPollResult poll = sut.TryPoll(jobId, tenantId);

            if (poll.Completed && poll.DocxBytes is not null)
            {
                completed = poll;
                break;
            }

            await Task.Delay(25);
        }

        completed.Should().NotBeNull();
        completed!.DocxBytes.Should().NotBeEmpty();
        completed.FileName.Should().Contain("ArchLucid-value-report");
        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public void InMemoryValueReportJobQueue_poll_returns_not_found_for_wrong_tenant()
    {
        ServiceCollection services = new();
        services.AddSingleton(Mock.Of<IValueReportMetricsReader>());
        services.AddSingleton<IOptionsMonitor<ValueReportComputationOptions>>(
            new TestOptionsMonitor<ValueReportComputationOptions>(new ValueReportComputationOptions()));
        services.AddSingleton<ValueReportBuilder>();
        services.AddSingleton(Mock.Of<IValueReportRenderer>());
        services.AddSingleton(Mock.Of<IAuditService>());
        services.AddDistributedMemoryCache();
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        IDistributedCache distributedCache = provider.GetRequiredService<IDistributedCache>();
        InMemoryValueReportJobQueue sut = new(scopeFactory, distributedCache, NullLogger<InMemoryValueReportJobQueue>.Instance);
        Guid tenantId = Guid.NewGuid();
        Guid jobId = sut.Enqueue(new ValueReportJobRequest(tenantId, Guid.NewGuid(), Guid.NewGuid(), DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow));

        ValueReportJobPollResult poll = sut.TryPoll(jobId, Guid.NewGuid());

        poll.Found.Should().BeFalse();
    }

    [Fact]
    public async Task InMemoryValueReportJobQueue_poll_reads_job_enqueued_on_another_instance_via_distributed_cache()
    {
        ServiceCollection services = new();
        Mock<IValueReportMetricsReader> metrics = new();
        metrics
            .Setup(m => m.ReadAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValueReportRawMetrics([], 1, 1, 0, 0, 0, 0, null, null, null, null, 0, null, null, null));
        services.AddSingleton(metrics.Object);
        services.AddSingleton<IOptionsMonitor<ValueReportComputationOptions>>(
            new TestOptionsMonitor<ValueReportComputationOptions>(new ValueReportComputationOptions()));
        services.AddSingleton<ValueReportBuilder>();
        Mock<IValueReportRenderer> renderer = new();
        renderer
            .Setup(r => r.RenderAsync(It.IsAny<ValueReportSnapshot>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([0x50, 0x4B, 0x03, 0x04]);
        services.AddSingleton(renderer.Object);
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        services.AddSingleton(audit.Object);
        services.AddDistributedMemoryCache();
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        IDistributedCache distributedCache = provider.GetRequiredService<IDistributedCache>();
        InMemoryValueReportJobQueue enqueueInstance =
            new(scopeFactory, distributedCache, NullLogger<InMemoryValueReportJobQueue>.Instance);
        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, distributedCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        ValueReportJobRequest request = new(
            tenantId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(-7),
            DateTimeOffset.UtcNow);

        Guid jobId = enqueueInstance.Enqueue(request);

        ValueReportJobPollResult? completed = null;

        for (int attempt = 0; attempt < 40; attempt++)
        {
            ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

            if (poll.Found && poll.Completed && poll.DocxBytes is not null)
            {
                completed = poll;
                break;
            }

            await Task.Delay(25);
        }

        completed.Should().NotBeNull();
        completed!.DocxBytes.Should().NotBeEmpty();
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
