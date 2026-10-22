namespace ArchLucid.Application.Tenancy;

/// <summary>
///     HTTP-facing facade for self-service trial routes previously in <c>TenantTrialController</c>.
/// </summary>
public interface ITenantTrialFacade
{
    Task<TenantTrialStatusQueryResult> GetTrialStatusAsync(CancellationToken cancellationToken);

    Task<TenantTrialLinkEntraResult> LinkEntraAsync(
        TenantTrialLinkEntraBody body,
        string actor,
        CancellationToken cancellationToken);

    Task<TenantTrialConvertResult> ConvertTrialAsync(
        TenantTrialConvertBody? body,
        string actor,
        CancellationToken cancellationToken);
}
