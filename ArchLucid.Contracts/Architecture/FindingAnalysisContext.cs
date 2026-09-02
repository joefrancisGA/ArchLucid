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

    /// <summary>Categories that enabled policy packs require engines to cover (wave-3 suggestion 26).</summary>
    public IReadOnlyList<string> RequiredFindingCategories
    {
        get;
        init;
    } = [];

    /// <summary>Engine types that enabled policy packs require to succeed (wave-4 suggestion 33).</summary>
    public IReadOnlyList<string> RequiredEngineTypes
    {
        get;
        init;
    } = [];

    /// <summary>Primary pinned extractor evidence for effectful engines (wave-4 suggestion 32).</summary>
    public EvidencePackagePin? EvidencePin
    {
        get;
        init;
    }

    /// <summary>All pinned extractor packages for multi-cloud effectful engines (wave-6 suggestion 55).</summary>
    public IReadOnlyList<EvidencePackagePin> EvidencePins
    {
        get;
        init;
    } = [];
}
