using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Metering;
using ArchLucid.Persistence.Options;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tests;

/// <summary>TB-582 — batched API request usage metering buffer and flush.</summary>
[Trait("Suite", "Core")]
public sealed class ApiRequestUsageEventBufferTests
{
    [SkippableFact]
    public void Enqueue_when_metering_disabled_does_not_buffer()
    {
        FixedOptionsMonitor<MeteringOptions> options = new(new MeteringOptions { Enabled = false });
        ApiRequestUsageEventBuffer buffer = new(options);

        buffer.Enqueue(
            new UsageEvent
            {
                TenantId = Guid.NewGuid(),
                Kind = UsageMeterKind.ApiRequest,
                Quantity = 1,
            });

        buffer.TryDequeue(out UsageEvent? _).Should().BeFalse();
    }

    [SkippableFact]
    public void Enqueue_when_metering_enabled_buffers_until_read()
    {
        FixedOptionsMonitor<MeteringOptions> options = new(new MeteringOptions { Enabled = true });
        ApiRequestUsageEventBuffer buffer = new(options);
        Guid tenantId = Guid.NewGuid();

        buffer.Enqueue(
            new UsageEvent
            {
                TenantId = tenantId,
                Kind = UsageMeterKind.ApiRequest,
                Quantity = 1,
                CorrelationId = "trace-a",
            });

        buffer.TryDequeue(out UsageEvent? usageEvent).Should().BeTrue();
        usageEvent!.TenantId.Should().Be(tenantId);
        usageEvent.CorrelationId.Should().Be("trace-a");
    }
}

/// <summary>TB-582 — in-memory batch insert path used by flush hosted service.</summary>
[Trait("Suite", "Core")]
public sealed class UsageMeteringServiceBatchTests
{
    [SkippableFact]
    public async Task RecordBatchAsync_persists_all_events()
    {
        InMemoryUsageEventRepository repository = new();
        FixedOptionsMonitor<MeteringOptions> options = new(new MeteringOptions { Enabled = true });
        UsageMeteringService service = new(repository, options);
        Guid tenantId = Guid.NewGuid();

        DateTimeOffset recordedUtc = DateTimeOffset.UtcNow;

        IReadOnlyList<UsageEvent> events =
        [
            new UsageEvent { TenantId = tenantId, Kind = UsageMeterKind.ApiRequest, Quantity = 1, RecordedUtc = recordedUtc },
            new UsageEvent { TenantId = tenantId, Kind = UsageMeterKind.ApiRequest, Quantity = 1, RecordedUtc = recordedUtc },
        ];

        await service.RecordBatchAsync(events, CancellationToken.None);

        IReadOnlyList<UsageEvent> stored =
            await repository.ListAsync(
                tenantId,
                DateTimeOffset.UtcNow.AddHours(-1),
                DateTimeOffset.UtcNow.AddHours(1),
                UsageMeterKind.ApiRequest,
                10,
                CancellationToken.None);

        stored.Should().HaveCount(2);
    }
}
