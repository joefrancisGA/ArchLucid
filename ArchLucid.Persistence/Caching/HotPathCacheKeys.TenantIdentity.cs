using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Caching;

public static partial class HotPathCacheKeys
{
    /// <summary>Tenant revision stamp for custom-role assignment / role list caches.</summary>
    public static string CustomRoleTenantRevision(Guid tenantId)
    {
        return $"{Prefix}cr-rev:{tenantId:N}";
    }

    /// <summary>Custom-role assignments joined with role metadata for one SCIM user.</summary>
    public static string CustomRoleAssignmentsForUser(Guid tenantId, Guid userId, long revision)
    {
        return $"{Prefix}cr-assign:{tenantId:N}:{userId:N}:r{revision}";
    }

    /// <summary>Custom role by tenant + role id at a tenant revision.</summary>
    public static string CustomRoleById(Guid tenantId, Guid roleId, long revision)
    {
        return $"{Prefix}cr:{tenantId:N}:{roleId:N}:r{revision}";
    }

    /// <summary>All custom roles for a tenant at a tenant revision.</summary>
    public static string CustomRoleListByTenant(Guid tenantId, long revision)
    {
        return $"{Prefix}cr-list:{tenantId:N}:r{revision}";
    }

    /// <summary>SCIM user by tenant + directory external id (claims transform hot path).</summary>
    public static string ScimUserByExternalId(Guid tenantId, string externalId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(externalId);

        return $"{Prefix}scim-ext:{tenantId:N}:{externalId.Trim()}";
    }

    /// <summary>SCIM user by tenant + surrogate id.</summary>
    public static string ScimUserById(Guid tenantId, Guid userId)
    {
        return $"{Prefix}scim:{tenantId:N}:{userId:N}";
    }

    /// <summary>Tenant catalog row by id (erasure quarantine middleware hot path).</summary>
    public static string TenantById(Guid tenantId)
    {
        return $"{Prefix}tenant:{tenantId:N}";
    }

    /// <summary>Tenant settings key/value by tenant + setting key.</summary>
    public static string TenantSetting(Guid tenantId, string settingKey)
    {
        string normalizedKey = TenantSettingKeyNormalizer.Normalize(settingKey);

        return $"{Prefix}tset:{tenantId:N}:{normalizedKey}";
    }

    /// <summary>Tenant AI budget policy override row.</summary>
    public static string TenantAiBudgetPolicy(Guid tenantId)
    {
        return $"{Prefix}aibudget:{tenantId:N}";
    }

    /// <summary>Tenant ROI cost settings row.</summary>
    public static string TenantCostSettings(Guid tenantId)
    {
        return $"{Prefix}tcost:{tenantId:N}";
    }

    /// <summary>Tenant identity provider configuration row.</summary>
    public static string TenantIdentityProviderConfiguration(Guid tenantId)
    {
        return $"{Prefix}tidp:{tenantId:N}";
    }

    /// <summary>Sign-in email domain routing lookup by normalized domain.</summary>
    public static string TenantSignInEmailDomainByNormalized(string normalizedDomain)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedDomain);

        return $"{Prefix}tsignin-dom:{normalizedDomain.Trim().ToUpperInvariant()}";
    }

    /// <summary>Sign-in email domains listed for one tenant.</summary>
    public static string TenantSignInEmailDomainListByTenant(Guid tenantId)
    {
        return $"{Prefix}tsignin-list:{tenantId:N}";
    }

    /// <summary>Sign-in email domain by tenant + normalized domain.</summary>
    public static string TenantSignInEmailDomainByTenantAndNormalized(Guid tenantId, string normalizedDomain)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedDomain);

        return $"{Prefix}tsignin:{tenantId:N}:{normalizedDomain.Trim().ToUpperInvariant()}";
    }
}
