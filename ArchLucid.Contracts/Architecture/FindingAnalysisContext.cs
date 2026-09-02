namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Policy theory-in-force and typed prior revision for finding-engine orchestration.
/// </summary>
public sealed class FindingAnalysisContext
{
    public Guid RunId
    {
        get;
        init;
    }

    public Guid ContextSnapshotId
    {
        get;
        init;
    }

    public Guid? ArchitectureVersionId
    {
        get;
        init;
    }

    public IReadOnlyList<string> EnabledPolicyPackIds
    {
        get;
        init;
    } = [];

    public PriorReviewSnapshots? Prior
    {
        get;
        init;
    }

    public string ContextCanonicalFingerprint
    {
        get;
        init;
    } = string.Empty;

    public string KnowledgeModelFingerprint
    {
        get;
        init;
    } = string.Empty;
}
