using ArchLucid.Contracts.Explanation;

namespace ArchLucid.Application.Explanation;

/// <summary>Builds run-level retrieval grounding diagnostics for operator forensic views.</summary>
public interface IRunRetrievalGroundingService
{
    /// <summary>Returns redaction-safe grounding rows, or <see langword="null" /> when the run is missing or out of scope.</summary>
    Task<RunRetrievalGroundingResponse?> BuildAsync(
        string runId,
        CancellationToken cancellationToken = default);
}
