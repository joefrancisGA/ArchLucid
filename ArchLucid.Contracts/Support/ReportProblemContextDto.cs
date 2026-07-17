namespace ArchLucid.Contracts.Support;

public sealed class ReportProblemContextDto
{
    public string? ReviewId
    {
        get;
        set;
    }

    public string? TenantId
    {
        get;
        set;
    }

    public string? WorkspaceId
    {
        get;
        set;
    }

    public string? ProductVersion
    {
        get;
        set;
    }

    public string? UiVersion
    {
        get;
        set;
    }

    public string? BrowserClient
    {
        get;
        set;
    }

    public string? CorrelationId
    {
        get;
        set;
    }

    public string? ClientRequestId
    {
        get;
        set;
    }

    public string? RoutePath
    {
        get;
        set;
    }

    public string? ErrorCode
    {
        get;
        set;
    }

    public string? ErrorTitle
    {
        get;
        set;
    }

    public int? HttpStatus
    {
        get;
        set;
    }

    public string? SubmittedAtUtc
    {
        get;
        set;
    }
}
