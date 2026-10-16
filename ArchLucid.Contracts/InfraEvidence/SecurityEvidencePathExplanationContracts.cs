using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class BuildSecurityEvidencePathExplanationRequest
{
    public bool UseSimulator
    {
        get;
        init;
    }

    /// <summary>When false (default), generation is skipped for InsufficientEvidence-only paths.</summary>
    public bool AllowInsufficientEvidence
    {
        get;
        init;
    }
}

public sealed class SecurityEvidencePathExplanationResponse
{
    public Guid ExplanationId
    {
        get;
        init;
    }

    public Guid PathId
    {
        get;
        init;
    }

    public string ExecutiveSummary
    {
        get;
        init;
    } = string.Empty;

    private IReadOnlyList<string> businessImpactHypotheses = [];

    public IReadOnlyList<string> BusinessImpactHypotheses
    {
        get => businessImpactHypotheses;
        init => businessImpactHypotheses = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private SecurityEvidencePathProposedRemediationResponse proposedRemediation = new();

    public SecurityEvidencePathProposedRemediationResponse ProposedRemediation
    {
        get => proposedRemediation;
        init => proposedRemediation = value ?? new();
    }

    private IReadOnlyList<string> citedEvidenceRefs = [];

    public IReadOnlyList<string> CitedEvidenceRefs
    {
        get => citedEvidenceRefs;
        init => citedEvidenceRefs = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public string ProvenanceKind
    {
        get;
        init;
    } = string.Empty;

    public string? SimulatorLabel
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

public sealed class SecurityEvidencePathProposedRemediationResponse
{
    public string RecommendedChange
    {
        get;
        init;
    } = string.Empty;

    public string RecommendedChangeSource
    {
        get;
        init;
    } = string.Empty;

    private IReadOnlyList<string> verificationQueries = [];

    public IReadOnlyList<string> VerificationQueries
    {
        get => verificationQueries;
        init => verificationQueries = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> preconditions = [];

    public IReadOnlyList<string> Preconditions
    {
        get => preconditions;
        init => preconditions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public string? SuggestedPatternKey
    {
        get;
        init;
    }
}

public sealed class SecurityEvidencePathExplanationResultResponse
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

    public SecurityEvidencePathExplanationResponse? Explanation
    {
        get;
        init;
    }
}
