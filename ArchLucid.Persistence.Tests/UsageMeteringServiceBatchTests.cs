using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Metering;
using ArchLucid.Persistence.Options;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests;

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
