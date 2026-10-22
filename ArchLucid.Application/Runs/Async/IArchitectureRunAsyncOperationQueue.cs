namespace ArchLucid.Application.Runs.Async;

/// <summary>In-process queue for async execute/replay siblings (TB-2075).</summary>
public interface IArchitectureRunAsyncOperationQueue
{
    ValueTask EnqueueAsync(ArchitectureRunAsyncOperationWorkItem workItem, CancellationToken cancellationToken = default);
}
