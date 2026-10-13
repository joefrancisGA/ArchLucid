namespace ArchLucid.Persistence.InfraEvidence;

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

    public IReadOnlyList<AuditEvidenceLineageVerifiedRemediationAssociation> VerifiedRemediationAssociations
    {
        get;
        init;
    } = [];

    /// <summary>
    /// Newest mapped attempt that is not already in <see cref="VerifiedRemediationAssociations"/>. Null when none.
    /// </summary>
    public AuditEvidenceLineageLatestRemediationAttempt? LatestRemediationAttempt
    {
        get;
        init;
    }
}
