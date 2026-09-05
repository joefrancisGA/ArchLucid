using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceItemRecord
{
    public Guid EvidenceItemId
    {
        get;
        init;
    }

    public Guid EvaluationId
    {
        get;
        init;
    }

    public Guid RequirementId
    {
        get;
        init;
    }

    public Guid TenantId
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

    public AuditEvidenceCollectionStatus CollectionStatus
    {
        get;
        init;
    }

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}

public sealed class AuditControlEvaluationRecord
{
    public Guid EvaluationId
    {
        get;
        init;
    }

    public Guid ControlId
    {
        get;
        init;
    }

    public Guid FrameworkId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public AuditEvaluationOutcome Outcome
    {
        get;
        init;
    }

    public int PassCount
    {
        get;
        init;
    }

    public int ApplicableCount
    {
        get;
        init;
    }

    public decimal Confidence
    {
        get;
        init;
    }

    public string EvaluationText
    {
        get;
        init;
    } = string.Empty;

    public string Formula
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<Guid> RequirementIds
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> ExceptionIds
    {
        get;
        init;
    } = [];

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }

    public string? HumanDisposition
    {
        get;
        init;
    }

    public string? Notes
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}

public sealed class AuditControlEvaluationPersistRequest
{
    public AuditControlEvaluationRecord Evaluation
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<AuditEvidenceItemRecord> EvidenceItems
    {
        get;
        init;
    } = [];
}
