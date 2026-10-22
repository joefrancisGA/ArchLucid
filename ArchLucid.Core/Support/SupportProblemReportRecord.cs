namespace ArchLucid.Core.Support;

public sealed class SupportProblemReportRecord
{
    public Guid Id
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid? ProjectId
    {
        get;
        init;
    }

    public string SubmittedByActorId
    {
        get;
        init;
    } = string.Empty;

    public string ContextJson
    {
        get;
        init;
    } = string.Empty;

    public string? OperatorNote
    {
        get;
        init;
    }

    public string? CorrelationId
    {
        get;
        init;
    }

    public string? ClientRequestId
    {
        get;
        init;
    }

    public string? SupportBundleBlobPath
    {
        get;
        init;
    }

    public string Status
    {
        get;
        init;
    } = SupportProblemReportStatus.Open;

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }
}
