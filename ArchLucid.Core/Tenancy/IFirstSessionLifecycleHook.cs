namespace ArchLucid.Core.Tenancy;

/// <summary>Product funnel hook: first successful golden-manifest commit per tenant.</summary>
public interface IFirstSessionLifecycleHook
{
    /// <summary>Idempotent per tenant; safe to call on every successful commit path.</summary>
    Task OnSuccessfulManifestCommitAsync(Guid tenantId, CancellationToken cancellationToken);
}
