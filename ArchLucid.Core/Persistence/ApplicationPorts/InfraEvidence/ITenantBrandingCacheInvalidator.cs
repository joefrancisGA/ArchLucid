namespace ArchLucid.Persistence.InfraEvidence;

public interface ITenantBrandingCacheInvalidator
{
    void InvalidateTenantCache(Guid tenantId);
}
