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

    private const string UnknownFailedJobErrorMessage =
        "Value report job failed — retry the async export or contact support if the problem persists.";

    private const string MissingCompletedDocumentErrorMessage =
        "Value report job completed but the document is unavailable — retry the async export.";

    private static JobEntry PreferDistributedPollState(JobEntry local, JobEntry distributed) =>
        local.Phase switch
        {
            JobPhase.Pending when distributed.Phase is JobPhase.Completed or JobPhase.Failed => distributed,
            JobPhase.Completed when distributed.Phase == JobPhase.Failed => distributed,
            JobPhase.Completed when local.Bytes is not { Length: > 0 } &&
                                    distributed.Phase == JobPhase.Pending => distributed,
            JobPhase.Completed when local.Bytes is not { Length: > 0 } &&
                                    distributed is { Phase: JobPhase.Completed, Bytes: { Length: > 0 } } => distributed,
            JobPhase.Failed when distributed is { Phase: JobPhase.Completed, Bytes: { Length: > 0 } } => distributed,
            _ => local,
        };

    private void PruneTerminalLocalJobs()
    {
        foreach (Guid jobId in _jobs.Keys.ToArray())
        {
            if (_jobs.TryGetValue(jobId, out JobEntry? entry) &&
                entry.Phase is JobPhase.Completed or JobPhase.Failed)
            {
                _jobs.TryRemove(jobId, out _);
            }
        }
    }

    public ValueReportJobPollResult TryPoll(Guid jobId, Guid scopedTenantId)
    {
        _jobs.TryGetValue(jobId, out JobEntry? entry);
        DistributedStateReadResult distributedRead = TryReadDistributedState(jobId);
        JobEntry? distributed = distributedRead.Entry;

        if (entry is null)
        {
            if (distributedRead.CorruptPayload)
                return new ValueReportJobPollResult(true, false, null, null, UnknownFailedJobErrorMessage);

            entry = distributed;

            if (entry is null)
                return new ValueReportJobPollResult(false, false, null, null, null);
        }
        else if (distributed is not null)
        {
            entry = PreferDistributedPollState(entry, distributed);
        }
        else if (distributedRead.CorruptPayload &&
                 entry is not { Phase: JobPhase.Completed, Bytes: { Length: > 0 } })
        {
            entry = PreferDistributedPollState(entry, CreateCorruptDistributedFailureEntry(entry.Request));
        }

        if (entry.Request.TenantId != scopedTenantId)
            return new ValueReportJobPollResult(false, false, null, null, null);

        return entry.Phase switch
        {
            JobPhase.Pending => new ValueReportJobPollResult(true, false, null, entry.FileName, null),
            JobPhase.Completed when entry.Bytes is { Length: > 0 } =>
                new ValueReportJobPollResult(true, true, entry.Bytes, entry.FileName, null),
            JobPhase.Completed =>
                new ValueReportJobPollResult(true, false, null, entry.FileName, MissingCompletedDocumentErrorMessage),
            JobPhase.Failed => new ValueReportJobPollResult(
                true,
                false,
                null,
                entry.FileName,
                string.IsNullOrWhiteSpace(entry.ErrorMessage) ? UnknownFailedJobErrorMessage : entry.ErrorMessage),
            _ => new ValueReportJobPollResult(true, false, null, null, "Unknown job phase.")
        };
    }
}
