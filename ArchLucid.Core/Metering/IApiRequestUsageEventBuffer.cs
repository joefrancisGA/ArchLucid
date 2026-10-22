namespace ArchLucid.Core.Metering;

/// <summary>
///     Non-blocking queue for <see cref="UsageMeterKind.ApiRequest" /> events (TB-582). Middleware enqueues;
///     a hosted flush drains batches to <see cref="IUsageMeteringService.RecordBatchAsync" />.
/// </summary>
public interface IApiRequestUsageEventBuffer
{
    /// <summary>Queues one API request usage event when metering is enabled.</summary>
    void Enqueue(UsageEvent usageEvent);
}
