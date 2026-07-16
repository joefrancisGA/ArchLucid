using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Seeds isolated tenants for <see cref="JwtLocalSigningWebAppFactory" /> hosts
///     (<c>ArchLucid:StorageProvider=InMemory</c>).
/// </summary>
internal static class JwtLocalSigningIntegrationTestTenant
{
    public static async Task<Guid> SeedStandardTierTenantAsync(
        JwtLocalSigningWebAppFactory factory,
        CancellationToken cancellationToken = default)
    {
        Guid tenantId = Guid.NewGuid();
        string slug = "jwt-it-" + tenantId.ToString("N");

        using IServiceScope scope = factory.Services.CreateScope();

        ITenantRepository tenants = scope.ServiceProvider.GetRequiredService<ITenantRepository>();

        if (tenants is not InMemoryTenantRepository inMemory)
        {
            throw new InvalidOperationException(
                $"JWT integration tests require singleton {nameof(InMemoryTenantRepository)}. Found {tenants.GetType().FullName ?? "null"}");
        }

        await inMemory.InsertTenantAsync(
            tenantId,
            "JWT Integration Tenant " + tenantId.ToString("N"),
            slug,
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            cancellationToken);

        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        await inMemory.InsertWorkspaceAsync(workspaceId, tenantId, "Default", projectId, cancellationToken);

        return tenantId;
    }

    public static string MintBearerJwtForTenant(
        JwtLocalSigningWebAppFactory factory,
        Guid tenantId,
        string name,
        IReadOnlyList<string> roles) =>
        JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            name,
            roles,
            tenantId,
            ScopeIds.DefaultWorkspace,
            ScopeIds.DefaultProject);
}
