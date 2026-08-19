namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Drains <see cref="IAuthorityPipelineWorkRepository" /> and completes deferred authority runs.</summary>
public interface IAuthorityPipelineWorkProcessor
{
    Task<int> ProcessPendingBatchAsync(CancellationToken cancellationToken = default);
}
