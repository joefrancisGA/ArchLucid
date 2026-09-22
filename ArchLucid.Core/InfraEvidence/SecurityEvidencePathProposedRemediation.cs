namespace ArchLucid.Core.InfraEvidence;

/// <summary>SA-17 proposed remediation slots aligned with SA-14 narrative fields.</summary>
public sealed class SecurityEvidencePathProposedRemediation
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
    } = RemediationPathNarrativeRecommendedChangeSources.WeakestHop;

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
