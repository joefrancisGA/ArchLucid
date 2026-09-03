namespace ArchLucid.Core.Comparison;

/// <summary>
///     Wave-13 suggestion 126: create-time pin and manifest hash fingerprints captured on comparison output.
/// </summary>
public sealed class CompareInputFingerprints
{
    public const string AlgorithmVersion = "compare-input-fingerprints.v1";

    public string ComparisonAlgorithmVersion
    {
        get;
        set;
    } = AlgorithmVersion;

    public string? BasePolicyPackPinHashSha256
    {
        get;
        set;
    }

    public string? TargetPolicyPackPinHashSha256
    {
        get;
        set;
    }

    public string? BaseEvidencePackagePinHashSha256
    {
        get;
        set;
    }

    public string? TargetEvidencePackagePinHashSha256
    {
        get;
        set;
    }

    public string? BaseArchitectureVersionContentHashSha256
    {
        get;
        set;
    }

    public string? TargetArchitectureVersionContentHashSha256
    {
        get;
        set;
    }

    public string? BaseKnowledgeModelContentHashSha256
    {
        get;
        set;
    }

    public string? TargetKnowledgeModelContentHashSha256
    {
        get;
        set;
    }

    public string? BaseManifestHashSha256
    {
        get;
        set;
    }

    public string? TargetManifestHashSha256
    {
        get;
        set;
    }
}
