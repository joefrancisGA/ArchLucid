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
