using ArchLucid.Application.Tenancy;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Marketing;
using ArchLucid.Core.OperationalErrors;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.CustomerSuccess;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.OperationalErrors;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIntegrationsConnectorsTenantDeletion(IServiceCollection services)
    {
        services.AddSingleton<ITenantHardPurgeService, NoOpTenantHardPurgeService>();
        services.AddSingleton<IPlatformAuditRepository, NoOpPlatformAuditRepository>();
        services.AddSingleton<IOperationalErrorRepository, NoOpOperationalErrorRepository>();
        services.AddSingleton<ITenantBlobPrefixDeletionService, NoOpTenantBlobPrefixDeletionService>();
        services.AddScoped<ITenantDeletionService, TenantDeletionService>();
        services.AddScoped<ITenantErasureCommandService, TenantErasureCommandService>();
        services.AddScoped<ITenantSuspendCommandService, TenantSuspendCommandService>();
        services.AddSingleton<ITenantCustomerSuccessRepository, InMemoryTenantCustomerSuccessRepository>();
        services.AddSingleton<ICorePilotTeamChecklistRepository, InMemoryCorePilotTeamChecklistRepository>();
        services.AddSingleton<IOperatorStickinessSnapshotReader, InMemoryOperatorStickinessSnapshotReader>();
        services.AddSingleton<IAdminTenantHealthReader, InMemoryAdminTenantHealthReader>();
        services.AddSingleton<IMarketingEarlyAccessRequestRepository, NoOpMarketingEarlyAccessRequestRepository>();
    }
}
