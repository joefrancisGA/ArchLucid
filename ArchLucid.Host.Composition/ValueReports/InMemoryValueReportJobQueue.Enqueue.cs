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

        WriteDistributedState(jobId, entry);

        _ = RunJobAsync(jobId, request);

        return jobId;
    }
}
