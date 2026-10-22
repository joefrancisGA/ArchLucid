using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceSelectorDescriptorRecord
{
    public string CollectorId
    {
        get;
        init;
    } = string.Empty;

    public string Version
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<string> EvidenceTypesProduced
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> RequiredAzurePermissions
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> SupportedResourceTypes
    {
        get;
        init;
    } = [];

    public string CollectionMethod
    {
        get;
        init;
    } = string.Empty;

    public string? ExpectedCost
    {
        get;
        init;
    }

    public string? ExpectedDuration
    {
        get;
        init;
    }

    public string? FreshnessCharacteristics
    {
        get;
        init;
    }
}

public sealed class AuditEvidenceCandidateRecord
{
    public Guid RequirementId
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string? AzureResourceId
    {
        get;
        init;
    }

    public string EvidenceType
    {
        get;
        init;
    } = string.Empty;

    public string Summary
    {
        get;
        init;
    } = string.Empty;

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }
}

public sealed class AuditEvidenceGapRecord
{
    public Guid RequirementId
    {
        get;
        init;
    }

    public AuditEvidenceCollectionStatus CollectionStatus
    {
        get;
        init;
    }

    public string Reason
    {
        get;
        init;
    } = string.Empty;
}

public sealed class AuditEvidenceRequirementSelectionRecord
{
    public AuditEvidenceRequirementRecord Requirement
    {
        get;
        init;
    } = null!;

    public AuditEvidenceCollectionStatus CollectionStatus
    {
        get;
        init;
    }

    public IReadOnlyList<AuditEvidenceCandidateRecord> Candidates
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AuditEvidenceGapRecord> Gaps
    {
        get;
        init;
    } = [];
}

public sealed class AuditEvidenceSelectionResult
{
    public Guid SnapshotId
    {
        get;
        init;
    }

    public IReadOnlyList<AuditEvidenceRequirementSelectionRecord> Selections
    {
        get;
        init;
    } = [];
}
