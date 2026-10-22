using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditControlReadinessRecord
{
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

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public AuditControlApplicabilityStatus Applicability
    {
        get;
        init;
    }

    public int EvidenceRequiredCount
    {
        get;
        init;
    }

    public int EvidenceCollectedCount
    {
        get;
        init;
    }

    public AuditEvidenceFreshnessStatus WorstFreshnessStatus
    {
        get;
        init;
    }

    public AuditControlEvidenceCompleteness Completeness
    {
        get;
        init;
    }

    public AuditEvaluationOutcome? AutomatedEvaluationOutcome
    {
        get;
        init;
    }

    public bool ManualEvidenceRequired
    {
        get;
        init;
    }

    public IReadOnlyList<string> ApprovedExceptionIds
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> OutstandingActions
    {
        get;
        init;
    } = [];

    public bool ReadyForAuditorReview
    {
        get;
        init;
    }
}

public sealed class AuditAssessmentReadinessSummaryRecord
{
    public string AggregateLabel
    {
        get;
        init;
    } = "Audit readiness summary";

    public int ApplicableControlCount
    {
        get;
        init;
    }

    public int FullyEvidentCount
    {
        get;
        init;
    }

    public int PartiallyEvidentCount
    {
        get;
        init;
    }

    public int LackingEvidenceCount
    {
        get;
        init;
    }

    public int StaleEvidenceCount
    {
        get;
        init;
    }

    public int RequiresHumanEvidenceCount
    {
        get;
        init;
    }

    public int TechnicallyFailingCount
    {
        get;
        init;
    }

    public int ApprovedExceptionCount
    {
        get;
        init;
    }

    public int ReadyForAuditorReviewCount
    {
        get;
        init;
    }

    public IReadOnlyList<AuditControlReadinessRecord> Controls
    {
        get;
        init;
    } = [];
}
