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

    /// <summary>API commit SHA from <c>GET /version</c> (support search / bisect).</summary>
    public string? ApiCommitSha
    {
        get;
        set;
    }

    /// <summary>UI image commit SHA from the client deployment fingerprint.</summary>
    public string? UiCommitSha
    {
        get;
        set;
    }

    /// <summary>CI/deploy stamp (<c>GITHUB_RUN_ID</c>-attempt) shared by API and UI when CD stamps both.</summary>
    public string? DeployStamp
    {
        get;
        set;
    }

    /// <summary>Hosting environment name when known (API preferred over UI fingerprint).</summary>
    public string? Environment
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
