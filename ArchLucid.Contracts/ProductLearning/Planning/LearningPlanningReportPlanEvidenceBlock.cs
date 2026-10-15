using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ProductLearning.Planning;

/// <summary>Evidence backing a plan: totals plus capped, deterministically ordered reference lists.</summary>
public sealed class LearningPlanningReportPlanEvidenceBlock
{
    public int LinkedSignalCount
    {
        get;
        init;
    }

    public int LinkedArtifactCount
    {
        get;
        init;
    }

    public int LinkedArchitectureRunCount
    {
        get;
        init;
    }

    private IReadOnlyList<LearningPlanningReportSignalRef> signals = [];

    public IReadOnlyList<LearningPlanningReportSignalRef> Signals
    {
        get => signals;
        init => signals = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<LearningPlanningReportArtifactRef> artifacts = [];

    public IReadOnlyList<LearningPlanningReportArtifactRef> Artifacts
    {
        get => artifacts;
        init => artifacts = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> architectureRunIds = [];

    public IReadOnlyList<string> ArchitectureRunIds
    {
        get => architectureRunIds;
        init => architectureRunIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
