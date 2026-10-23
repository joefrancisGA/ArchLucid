using ArchLucid.Application.Value;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Host.Composition.ValueReports;

public sealed partial class InMemoryValueReportJobQueue
{
    public Guid Enqueue(ValueReportJobRequest request)
    {
        if (request is null)
            throw new ArgumentNullException(nameof(request));

        Guid jobId = Guid.NewGuid();
        JobEntry entry = new(request, JobPhase.Pending, null, null, null);

        if (!_jobs.TryAdd(jobId, entry))
            throw new InvalidOperationException("Duplicate job id (extremely unlikely).");

        if (!TryWriteDistributedState(jobId, entry))
        {
            const string persistError =
                "Value report job could not be enqueued for cross-instance polling because poll state could not be persisted — retry the async export.";

            JobEntry failed = new(request, JobPhase.Failed, null, null, persistError);
            _jobs[jobId] = failed;
            PublishDistributedTerminalStateOrClearStalePending(jobId, failed);

            return jobId;
        }

        _ = RunJobAsync(jobId, request);

        return jobId;
    }
}
