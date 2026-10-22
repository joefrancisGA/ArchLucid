namespace ArchLucid.Contracts.Support;

public sealed class SubmitSupportProblemReportResponse
{
    public Guid ReferenceId
    {
        get;
        set;
    }

    public DateTimeOffset SubmittedAtUtc
    {
        get;
        set;
    }

    public string SlaMessage
    {
        get;
        set;
    } = string.Empty;

    public bool SupportBundleAttached
    {
        get;
        set;
    }

    public string? SupportBundleAttachWarning
    {
        get;
        set;
    }
}
