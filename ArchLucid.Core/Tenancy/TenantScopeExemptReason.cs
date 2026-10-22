namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Classification bucket for <see cref="TenantScopeExemptAttribute" />; must align with
///     <c>docs/security/TENANT_TABLE_ISOLATION_CLASSIFICATION.md</c>.
/// </summary>
public enum TenantScopeExemptReason
{
    AcceptedResidual = 0,
    SystemPlaneOnly = 1,
    Operational = 2,
}
