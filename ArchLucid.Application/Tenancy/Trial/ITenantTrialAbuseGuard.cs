namespace ArchLucid.Application.Tenancy.Trial;

public interface ITenantTrialAbuseGuard
{
    Task<TenantTrialIdentityLinkPrecheckResult> ValidateIdentityLinkAsync(
        TenantTrialLinkEntraBody body,
        Guid tenantId,
        CancellationToken cancellationToken);
}

public sealed class TenantTrialIdentityLinkPrecheckResult
{
    public TenantTrialLinkEntraResult? Failure
    {
        get;
        init;
    }

    public string? NormalizedLocalEmail
    {
        get;
        init;
    }

    public bool HasIdentityPayload
    {
        get;
        init;
    }
}
