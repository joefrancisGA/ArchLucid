namespace ArchLucid.Core.OperationalErrors;

/// <summary>Append-only row for <c>dbo.PlatformOperationalErrors</c>.</summary>
public sealed class OperationalErrorRecord
{
    public Guid Id
    {
        get;
        set;
    } = Guid.NewGuid();

    public DateTime OccurredUtc
    {
        get;
        set;
    } = TimeProvider.System.UtcNowDateTime();

    public string Source
    {
        get;
        set;
    } = OperationalErrorSource.Api;

    public string Category
    {
        get;
        set;
    } = OperationalErrorCategory.UnhandledException;

    public int? HttpStatusCode
    {
        get;
        set;
    }

    public string? HttpMethod
    {
        get;
        set;
    }

    public string? RequestPath
    {
        get;
        set;
    }

    public string? ProblemType
    {
        get;
        set;
    }

    public string? ExceptionType
    {
        get;
        set;
    }

    public string Message
    {
        get;
        set;
    } = string.Empty;

    public string? StackTrace
    {
        get;
        set;
    }

    public int? SqlErrorNumber
    {
        get;
        set;
    }

    public int? SqlErrorState
    {
        get;
        set;
    }

    public string? CorrelationId
    {
        get;
        set;
    }

    public string? OtelTraceId
    {
        get;
        set;
    }

    public Guid? TenantId
    {
        get;
        set;
    }

    public Guid? WorkspaceId
    {
        get;
        set;
    }

    public Guid? ProjectId
    {
        get;
        set;
    }

    public string? ActorUserId
    {
        get;
        set;
    }

    public string DetailJson
    {
        get;
        set;
    } = "{}";
}
