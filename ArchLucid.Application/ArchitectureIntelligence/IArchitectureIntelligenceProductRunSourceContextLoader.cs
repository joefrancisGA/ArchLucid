namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArchitectureIntelligenceProductRunSourceContextLoader
{
    /// <summary>
    /// Loads intake description/documents for a product authority run into a
    /// <see cref="Contracts.ArchitectureIntelligence.ClosedLoopReasoningRequest"/>-shaped payload.
    /// </summary>
    Task<ArchitectureIntelligenceProductRunSourceContextLoadResult> LoadAsync(
        string runId,
        CancellationToken cancellationToken = default);
}
