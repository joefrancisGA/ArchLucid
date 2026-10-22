namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Outcome for one item submitted to <see cref="IArchitectureRunBatchCreateOrchestrator" />.</summary>
public sealed class BatchCreateRunItemOutcome
{
    /// <summary>Original <c>RequestId</c> from the input item, when present.</summary>
    public string? RequestId { get; init; }

    /// <summary>Assigned run identifier, set when <see cref="Succeeded" /> is <c>true</c>.</summary>
    public string? RunId { get; init; }

    /// <summary>Whether the run was created.</summary>
    public bool Succeeded { get; init; }

    /// <summary>Failure classification when <see cref="Succeeded" /> is <c>false</c>.</summary>
    public BatchCreateRunItemFailureKind FailureKind { get; init; } = BatchCreateRunItemFailureKind.None;

    /// <summary>Human-readable error description when <see cref="Succeeded" /> is <c>false</c>.</summary>
    public string? ErrorMessage { get; init; }
}
