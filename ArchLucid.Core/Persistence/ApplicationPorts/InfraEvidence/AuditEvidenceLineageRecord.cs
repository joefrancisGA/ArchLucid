using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceLineageQueryResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public AuditEvidenceLineageRecord? Lineage
    {
        get;
        init;
    }
}

public sealed class AuditEvidenceLineageRecord
{
    public Guid AssessmentId
    {
        get;
        init;
    }

    public Guid AuditEvidenceSnapshotId
    {
        get;
        init;
    }

    public Guid ControlId
    {
        get;
        init;
    }

    public string ControlNumber
    {
        get;
        init;
    } = string.Empty;

    public string ControlTitle
    {
        get;
        init;
    } = string.Empty;

    public bool ChainComplete
    {
        get;
        init;
    }

    public bool SnapshotHashVerified
    {
        get;
        init;
    }

    public bool ReadyForPositiveCheckbox
    {
        get;
        init;
    }

    public IReadOnlyList<string> BrokenLinkReasons
    {
        get;
        init;
    } = [];

    public AuditEvidenceLineageEvaluationNode? Evaluation
    {
        get;
        init;
    }

    public IReadOnlyList<AuditEvidenceLineageRequirementChain> RequirementChains
    {
        get;
        init;
    } = [];
}

public sealed class AuditEvidenceLineageEvaluationNode
{
    public Guid EvaluationId
    {
        get;
        init;
    }

    public AuditEvaluationOutcome Outcome
    {
        get;
        init;
    }

    public string Formula
    {
        get;
        init;
    } = string.Empty;

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
}

public sealed class AuditEvidenceLineageRequirementChain
{
    public Guid RequirementId
    {
        get;
        init;
    }

    public string RequirementName
    {
        get;
        init;
    } = string.Empty;

    public string EvidenceType
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<AuditEvidenceLineageEvidenceNode> Evidence
    {
        get;
        init;
    } = [];
}

public sealed class AuditEvidenceLineageEvidenceNode
{
    public Guid EvidenceRowId
    {
        get;
        init;
    }

    public Guid? EvaluationEvidenceItemId
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

    public string? NormalizedPointer
    {
        get;
        init;
    }

    public string? RawPointer
    {
        get;
        init;
    }

    public string? ApiQueryId
    {
        get;
        init;
    }

    public DateTime CollectedUtc
    {
        get;
        init;
    }

    public string CollectorVersion
    {
        get;
        init;
    } = string.Empty;

    public string SelectorVersion
    {
        get;
        init;
    } = string.Empty;

    public bool LinkComplete
    {
        get;
        init;
    }

    public bool ItemHashVerified
    {
        get;
        init;
    }

    public IReadOnlyList<string> MissingLinkKinds
    {
        get;
        init;
    } = [];
}
