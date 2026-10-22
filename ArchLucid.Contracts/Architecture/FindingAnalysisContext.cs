using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Serialization;

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

    private IReadOnlyList<string> enabledPolicyPackIds = [];

    public IReadOnlyList<string> EnabledPolicyPackIds
    {
        get => enabledPolicyPackIds;
        init => enabledPolicyPackIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

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
    private IReadOnlyList<string> requiredFindingCategories = [];

    public IReadOnlyList<string> RequiredFindingCategories
    {
        get => requiredFindingCategories;
        init => requiredFindingCategories = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> requiredEngineTypes = [];

    /// <summary>Engine types that enabled policy packs require to succeed (wave-4 suggestion 33).</summary>
    public IReadOnlyList<string> RequiredEngineTypes
    {
        get => requiredEngineTypes;
        init => requiredEngineTypes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Primary pinned extractor evidence for effectful engines (wave-4 suggestion 32).</summary>
    public EvidencePackagePin? EvidencePin
    {
        get;
        init;
    }

    /// <summary>All pinned extractor packages for multi-cloud effectful engines (wave-6 suggestion 55).</summary>
    private IReadOnlyList<EvidencePackagePin> evidencePins = [];

    public IReadOnlyList<EvidencePackagePin> EvidencePins
    {
        get => evidencePins;
        init => evidencePins = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Wave-7 suggestion 67: run header carries a create-time evidence pin hash commitment.</summary>
    public bool HasCreateTimeEvidencePinCommitment
    {
        get;
        init;
    }

    /// <summary>Missing-input attribution for fail-closed engines (DX-52). Null in golden harness.</summary>
    public IHeldCheckLedger? HeldCheckLedger
    {
        get;
        init;
    }
}
