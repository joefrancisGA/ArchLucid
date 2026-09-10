namespace ArchLucid.Core.Findings;

/// <summary>Append-only operator insight signal for measurement (does not mutate finding classification).</summary>
public sealed class FindingInsightSignalSubmission
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public string FindingId
    {
        get;
        init;
    } = string.Empty;

    public string UserId
    {
        get;
        init;
    } = string.Empty;

    public Contracts.Findings.FindingInsightSignalKind Kind
    {
        get;
        init;
    }
}
