namespace ArchLucid.Core.OperationalErrors;

/// <summary>Immutable capture payload enqueued by HTTP filters, middleware, or background jobs.</summary>
public sealed class OperationalErrorCaptureRequest
{
    public required string Source
    {
        get;
        init;
    }

    public required string Category
    {
        get;
        init;
    }

    public int? HttpStatusCode
    {
        get;
        init;
    }

    public string? HttpMethod
    {
        get;
        init;
    }

    public string? RequestPath
    {
        get;
        init;
    }

    public string? ProblemType
    {
        get;
        init;
    }

    public Exception? Exception
    {
        get;
        init;
    }

    public string? MessageOverride
    {
        get;
        init;
    }

    public string? CorrelationId
    {
        get;
        init;
    }

    public string? OtelTraceId
    {
        get;
        init;
    }

    public Guid? TenantId
    {
        get;
        init;
    }

    public Guid? WorkspaceId
    {
        get;
        init;
    }

    public Guid? ProjectId
    {
        get;
        init;
    }

    public string? ActorUserId
    {
        get;
        init;
    }

    public IReadOnlyDictionary<string, string>? DetailFields
    {
        get;
        init;
    }
}
