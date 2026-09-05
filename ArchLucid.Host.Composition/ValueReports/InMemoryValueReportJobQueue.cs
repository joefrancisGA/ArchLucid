using System.Collections.Concurrent;

using ArchLucid.Application.Value;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Host.Composition.ValueReports;

/// <summary>
/// In-process async generation for large windows (see <c>ValueReportComputationOptions.AsyncJobWhenWindowDaysExceeds</c>).
/// </summary>
public sealed partial class InMemoryValueReportJobQueue(
    IServiceScopeFactory scopeFactory,
    IValueReportJobPollStateCache pollStateCache,
    ILogger<InMemoryValueReportJobQueue> logger) : IValueReportJobQueue
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IValueReportJobPollStateCache _pollStateCache =
        pollStateCache ?? throw new ArgumentNullException(nameof(pollStateCache));

    private readonly ILogger<InMemoryValueReportJobQueue> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly ConcurrentDictionary<Guid, JobEntry> _jobs = new();

    public ValueReportJobPollResult TryPoll(Guid jobId, Guid scopedTenantId)
    {
        if (!_jobs.TryGetValue(jobId, out JobEntry? entry))
        {
            entry = TryReadDistributedState(jobId);

            if (entry is null)
                return new ValueReportJobPollResult(false, false, null, null, null);
        }

        if (entry.Request.TenantId != scopedTenantId)
            return new ValueReportJobPollResult(false, false, null, null, null);

        return entry.Phase switch
        {
            JobPhase.Pending => new ValueReportJobPollResult(true, false, null, entry.FileName, null),
            JobPhase.Completed => new ValueReportJobPollResult(true, true, entry.Bytes, entry.FileName, null),
            JobPhase.Failed => new ValueReportJobPollResult(true, false, null, entry.FileName, entry.ErrorMessage),
            _ => new ValueReportJobPollResult(true, false, null, null, "Unknown job phase.")
        };
    }
}
