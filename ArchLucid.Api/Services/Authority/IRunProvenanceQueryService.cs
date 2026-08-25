using ArchLucid.Api.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Persistence.Decisions;

namespace ArchLucid.Api.Services.Authority;

/// <summary>
///     Application read surface for run provenance, decisions, evidence, and trace forensics.
/// </summary>
public interface IRunProvenanceQueryService
{
    Task<bool> AuthorityRunExistsInScopeAsync(string runId, CancellationToken cancellationToken);

    Task<ArchitectureRunProvenanceGraph?> GetProvenanceAsync(string runId, CancellationToken cancellationToken);

    ProvenanceNodeExplanationQueryResult GetProvenanceNodeExplanationNotSupported();

    Task<RunDecisionsQueryResult> GetRunDecisionsAsync(string runId, CancellationToken cancellationToken);

    Task<RunEvidenceQueryResult> GetRunEvidenceAsync(string runId, CancellationToken cancellationToken);

    Task<RunTracesQueryResult> GetRunTracesAsync(
        string runId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);

    Task<RunToolInvocationForensicsQueryResult> GetRunToolInvocationForensicsAsync(
        string runId,
        CancellationToken cancellationToken);
}

public sealed class ProvenanceNodeExplanationQueryResult
{
    public string Detail { get; init; } = string.Empty;
    public IReadOnlyDictionary<string, object?> Hints { get; init; } =
        new Dictionary<string, object?>(StringComparer.Ordinal);
}

public sealed class RunDecisionsQueryResult
{
    public RunGraphQueryOutcome Outcome { get; init; }
    public DecisionNodeResponse? Response { get; init; }
    public string? ProblemDetail { get; init; }
}

public sealed class RunEvidenceQueryResult
{
    public RunGraphQueryOutcome Outcome { get; init; }
    public AgentEvidencePackageResponse? Response { get; init; }
    public string? ProblemDetail { get; init; }
}

public sealed class RunTracesQueryResult
{
    public RunGraphQueryOutcome Outcome { get; init; }
    public AgentExecutionTraceResponse? Response { get; init; }
    public string? ProblemDetail { get; init; }
}

public sealed class RunToolInvocationForensicsQueryResult
{
    public RunGraphQueryOutcome Outcome { get; init; }
    public RunToolInvocationForensicsResponse? Response { get; init; }
    public string? ProblemDetail { get; init; }
}
