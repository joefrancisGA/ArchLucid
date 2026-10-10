using ArchLucid.Core.Metering;
using ArchLucid.Host.Composition.Metering;
using ArchLucid.Persistence.Metering;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Metering;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApiRequestUsageEventBatchFlushHostedServiceTests
{
    [Fact]
    public async Task StopAsync_keeps_dequeued_usage_events_when_batch_persist_fails()
    {
        UsageEvent usageEvent = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = DateTimeOffset.Parse("2026-10-08T21:00:00Z"),
            IdempotencyKey = "request-1",
        };

        ServiceCollection services = new();
        services.Configure<MeteringOptions>(options => options.Enabled = true);
        Mock<IUsageMeteringService> metering = new();
        metering
            .Setup(candidate => candidate.RecordBatchAsync(
                It.IsAny<IReadOnlyList<UsageEvent>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("usage store unavailable"));
        services.AddSingleton(metering.Object);
        ServiceProvider provider = services.BuildServiceProvider();
        ApiRequestUsageEventBuffer buffer = new(provider.GetRequiredService<IOptionsMonitor<MeteringOptions>>());
        buffer.Enqueue(usageEvent);

        ApiRequestUsageEventBatchFlushHostedService service = new(
            buffer,
            provider.GetRequiredService<IServiceScopeFactory>(),
            provider.GetRequiredService<IOptionsMonitor<MeteringOptions>>(),
            NullLogger<ApiRequestUsageEventBatchFlushHostedService>.Instance);

        await service.StopAsync(CancellationToken.None);

        buffer.TryDequeue(out UsageEvent? restored).Should().BeTrue();
        restored!.IdempotencyKey.Should().Be("request-1");
        metering.Verify(
            candidate => candidate.RecordBatchAsync(
                It.Is<IReadOnlyList<UsageEvent>>(batch => batch.Count == 1),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task StopAsync_keeps_dequeued_usage_events_when_persist_fails_after_metering_disabled()
    {
        // Events already accepted while metering was on must survive a failed flush after Enabled flips off.
        // StopAsync still drains the buffer, and the public Enqueue path no-ops when metering is disabled.
        UsageEvent usageEvent = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = DateTimeOffset.Parse("2026-10-09T12:00:00Z"),
            IdempotencyKey = "request-disabled",
        };

        MeteringOptions meteringOptions = new() { Enabled = true };
        MutableMeteringOptionsMonitor monitor = new(meteringOptions);
        ServiceCollection services = new();
        Mock<IUsageMeteringService> metering = new();
        metering
            .Setup(candidate => candidate.RecordBatchAsync(
                It.IsAny<IReadOnlyList<UsageEvent>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("usage store unavailable"));
        services.AddSingleton(metering.Object);
        ServiceProvider provider = services.BuildServiceProvider();
        ApiRequestUsageEventBuffer buffer = new(monitor);
        buffer.Enqueue(usageEvent);
        meteringOptions.Enabled = false;

        ApiRequestUsageEventBatchFlushHostedService service = new(
            buffer,
            provider.GetRequiredService<IServiceScopeFactory>(),
            monitor,
            NullLogger<ApiRequestUsageEventBatchFlushHostedService>.Instance);

        await service.StopAsync(CancellationToken.None);

        metering.Verify(
            candidate => candidate.RecordBatchAsync(
                It.Is<IReadOnlyList<UsageEvent>>(batch => batch.Count == 1),
                It.IsAny<CancellationToken>()),
            Times.Once);
        buffer.TryDequeue(out UsageEvent? restored).Should().BeTrue();
        restored!.IdempotencyKey.Should().Be("request-disabled");
    }

    private sealed class MutableMeteringOptionsMonitor(MeteringOptions value) : IOptionsMonitor<MeteringOptions>
    {
        public MeteringOptions CurrentValue => value;

        public MeteringOptions Get(string? name) => value;

        public IDisposable OnChange(Action<MeteringOptions, string?> listener) => EmptyDisposable.Instance;

        private sealed class EmptyDisposable : IDisposable
        {
            internal static readonly EmptyDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
