using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests.Scim;

/// <summary>
///     Ensures <see cref="ScopeIds.DefaultTenant" /> exists before SCIM token inserts when CI process env leaks
///     <c>ArchLucid__StorageProvider=Sql</c> into otherwise in-memory JWT integration hosts.
/// </summary>
internal static class ScimIntegrationTestTenantSeed
{
    internal static async Task EnsureDefaultTenantAsync(
        IServiceProvider serviceProvider,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(serviceProvider);

        using IServiceScope scope = serviceProvider.CreateScope();
        ITenantRepository tenants = scope.ServiceProvider.GetRequiredService<ITenantRepository>();

        if (await tenants.GetByIdAsync(ScopeIds.DefaultTenant, cancellationToken).ConfigureAwait(false) is not null)
            return;

        await tenants.InsertTenantAsync(
            ScopeIds.DefaultTenant,
            "SCIM integration test tenant",
            "scim-integration-test",
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            cancellationToken).ConfigureAwait(false);
    }
}
