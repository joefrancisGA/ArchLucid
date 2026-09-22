namespace ArchLucid.Core.InfraEvidence;

/// <summary>Structured architect remediation narrative for findings that cite a PathId (SA-14).</summary>
public sealed class RemediationPathNarrative
{
    public Guid PathId
    {
        get;
        init;
    }

    public string PathKind
    {
        get;
        init;
    } = string.Empty;

    public string PathConfidenceBand
    {
        get;
        init;
    } = string.Empty;

    public string ProblemStatement
    {
        get;
        init;
    } = string.Empty;

    public string WhyItMatters
    {
        get;
        init;
    } = string.Empty;

    public string ExposureSummary
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<Guid> AffectedDependencyCloudResourceIds
    {
        get;
        init;
    } = [];

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

    public IReadOnlyList<string> Preconditions
    {
        get;
        init;
    } = [];

    public string BlastRadiusWarning
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<string> SafeRolloutSteps
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> VerificationQueries
    {
        get;
        init;
    } = [];

    public string WeakestHopReason
    {
        get;
        init;
    } = string.Empty;

    public string CanonicalHopHashHex
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Optional AiInference summary (SA-17); deterministic templates leave this null.</summary>
    public string? AiInferenceSummary
    {
        get;
        init;
    }
}

public static class RemediationPathNarrativeRecommendedChangeSources
{
    public const string CutPoint = "CutPoint";

    public const string Pattern = "Pattern";

    public const string WeakestHop = "WeakestHop";
}
