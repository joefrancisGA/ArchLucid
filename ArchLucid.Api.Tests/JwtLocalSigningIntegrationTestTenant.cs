using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Seeds isolated tenants for <see cref="JwtLocalSigningWebAppFactory" /> hosts so
///     <see cref="CommercialTenantTierFilter" /> can resolve <c>dbo.Tenants</c> (or the in-memory registry) for
///     JwtBearer callers that do not get DevelopmentBypass missing-tenant bypass.
/// </summary>
internal static class JwtLocalSigningIntegrationTestTenant
{
    internal sealed record Scope(Guid TenantId, Guid WorkspaceId, Guid ProjectId);

    public static async Task<Scope> SeedStandardTierScopeAsync(
        JwtLocalSigningWebAppFactory factory,
        CancellationToken cancellationToken = default)
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        string slug = "jwt-it-" + tenantId.ToString("N");

        using IServiceScope scope = factory.Services.CreateScope();
        ITenantRepository tenants = scope.ServiceProvider.GetRequiredService<ITenantRepository>();

        await tenants.InsertTenantAsync(
            tenantId,
            "JWT Integration Tenant " + tenantId.ToString("N"),
            slug,
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            cancellationToken);

        await tenants.InsertWorkspaceAsync(workspaceId, tenantId, "Default", projectId, cancellationToken);

        return new Scope(tenantId, workspaceId, projectId);
    }

    public static string MintBearerJwtForScope(
        JwtLocalSigningWebAppFactory factory,
        Scope testScope,
        string name,
        IReadOnlyList<string> roles) =>
        JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            name,
            roles,
            testScope.TenantId,
            testScope.WorkspaceId,
            testScope.ProjectId);
}
