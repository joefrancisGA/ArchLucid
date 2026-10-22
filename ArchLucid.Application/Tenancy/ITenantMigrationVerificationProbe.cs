namespace ArchLucid.Application.Tenancy;

public interface ITenantMigrationVerificationProbe
{
    Task<TenantMigrationVerificationProbeResult> RunAsync(Guid tenantId, CancellationToken cancellationToken);
}
