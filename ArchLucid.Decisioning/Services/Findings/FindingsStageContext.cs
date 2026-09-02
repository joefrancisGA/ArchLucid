using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Services.Findings;

/// <summary>Mutable state passed through findings snapshot generation stage handlers.</summary>
public sealed class FindingsStageContext
{
    public required Guid RunId { get; init; }

    public required Guid ContextSnapshotId { get; init; }

    public required GraphSnapshot GraphSnapshot { get; init; }

    public FindingAnalysisContext? AnalysisContext { get; init; }

    public List<Finding> AllFindings { get; } = [];

    public List<FindingEngineFailure> EngineFailures { get; } = [];

    public List<Exception> EngineExceptions { get; } = [];

    public int SuccessfulEngineInvocations { get; set; }

    public HashSet<string> SuccessfulEngineTypes { get; } = new(StringComparer.OrdinalIgnoreCase);

    public FindingsSnapshot? Snapshot { get; set; }

    public int DedupedFindingsCount { get; set; }
}
