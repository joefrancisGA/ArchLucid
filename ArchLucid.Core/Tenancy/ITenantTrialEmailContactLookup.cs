namespace ArchLucid.Core.Tenancy;

/// <summary>Resolves a trial notification mailbox from durable audit (no PII column on <c>dbo.Tenants</c>).</summary>
public interface ITenantTrialEmailContactLookup
{
    Task<string?> TryResolveAdminEmailAsync(Guid tenantId, CancellationToken cancellationToken);
}
