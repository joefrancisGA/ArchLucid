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

    [Fact]
    public void Requeue_when_metering_disabled_keeps_an_already_accepted_event()
    {
        MeteringOptions meteringOptions = new() { Enabled = true };
        FixedOptionsMonitor<MeteringOptions> options = new(meteringOptions);
        ApiRequestUsageEventBuffer buffer = new(options);
        UsageEvent usageEvent = new()
        {
            TenantId = Guid.NewGuid(),
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            IdempotencyKey = "request-disabled",
        };

        buffer.Enqueue(usageEvent);
        buffer.TryDequeue(out UsageEvent? _).Should().BeTrue();
        meteringOptions.Enabled = false;

        buffer.Requeue(usageEvent);

        buffer.TryDequeue(out UsageEvent? restored).Should().BeTrue();
        restored!.IdempotencyKey.Should().Be("request-disabled");
    }
}
