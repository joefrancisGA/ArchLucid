using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Metering;

/// <summary>Persists <see cref="UsageEvent" /> rows and drains batches accepted by the request buffer.</summary>
public sealed class UsageMeteringService(
    IUsageEventRepository repository,
    IOptionsMonitor<MeteringOptions> options) : IUsageMeteringService
{
    private readonly IOptionsMonitor<MeteringOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IUsageEventRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public async Task RecordAsync(UsageEvent usageEvent, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(usageEvent);

        if (!_options.CurrentValue.Enabled)
            return;

        await _repository.InsertAsync(usageEvent, ct);
    }

    public async Task RecordBatchAsync(IReadOnlyList<UsageEvent> events, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(events);

        // The request buffer checks Enabled at admission. Persist any events it already accepted.
        if (events.Count == 0)
            return;

        await _repository.InsertBatchAsync(events, ct);
    }

    public async Task<IReadOnlyList<TenantUsageSummary>> GetSummaryAsync(
        Guid tenantId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        CancellationToken ct)
    {
        if (!_options.CurrentValue.Enabled)
            return [];

        return await _repository.AggregateByKindAsync(tenantId, periodStart, periodEnd, ct);
    }
}
