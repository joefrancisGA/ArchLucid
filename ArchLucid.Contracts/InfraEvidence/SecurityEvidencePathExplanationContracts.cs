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

    public IReadOnlyList<string> BusinessImpactHypotheses
    {
        get;
        init;
    } = [];

    public SecurityEvidencePathProposedRemediationResponse ProposedRemediation
    {
        get;
        init;
    } = new();

    public IReadOnlyList<string> CitedEvidenceRefs
    {
        get;
        init;
    } = [];

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

    public IReadOnlyList<string> VerificationQueries
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> Preconditions
    {
        get;
        init;
    } = [];

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
