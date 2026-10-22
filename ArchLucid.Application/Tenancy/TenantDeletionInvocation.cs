namespace ArchLucid.Application.Tenancy;

/// <summary>Actor and correlation metadata for <see cref="ITenantDeletionService" />.</summary>
public sealed class TenantDeletionInvocation
{
    public required string ActorUserId
    {
        get;
        init;
    }

    public required string ActorUserName
    {
        get;
        init;
    }

    public string? CorrelationId
    {
        get;
        init;
    }
}
