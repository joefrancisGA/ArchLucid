namespace ArchLucid.Api.Demo;

/// <summary>Response for operator-scoped one-click demo review (<c>POST /v1/reviews/demo</c>).</summary>
public sealed class OperatorDemoReviewResponse
{
    /// <summary>Canonical run identifier (string form of GUID).</summary>
    public string RunId
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Committed golden manifest semantic version string.</summary>
    public string ManifestId
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Built-in policy pack display name applied for this demo run.</summary>
    public string PolicyPackName
    {
        get;
        init;
    } = string.Empty;

    public List<OperatorDemoReviewFindingSummary> TopFindings
    {
        get;
        init;
    } = [];

    /// <summary>Operator-shell deep link (<c>/reviews/{{runId}}</c>).</summary>
    public string RunDetailUrl
    {
        get;
        init;
    } = string.Empty;
}

public sealed class OperatorDemoReviewFindingSummary
{
    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string Severity
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Optional policy rule key when the finding payload carries one.</summary>
    public string? PolicyRuleKey
    {
        get;
        init;
    }
}
