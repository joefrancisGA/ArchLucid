using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Tenancy;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIdentityAuthDigestPrefs(IServiceCollection services)
    {
        services.AddSingleton<ITenantExecDigestPreferencesRepository, InMemoryTenantExecDigestPreferencesRepository>();
        services.AddSingleton<ITenantSponsorDigestPreferencesRepository, InMemoryTenantSponsorDigestPreferencesRepository>();
        services.AddSingleton<ITenantCatalogMigrationRepository, InMemoryTenantCatalogMigrationRepository>();
        services.AddSingleton<ITenantMigrationRetrievalOutboxDrainer, NoOpTenantMigrationRetrievalOutboxDrainer>();
    }
}
