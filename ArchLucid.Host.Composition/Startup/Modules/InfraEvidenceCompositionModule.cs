using ArchLucid.Application.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>Infrastructure-evidence plane application and persistence registrations.</summary>
public static class InfraEvidenceCompositionModule
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<IAzureInventorySnapshotHeaderService, AzureInventorySnapshotHeaderService>();
        services.AddScoped<IAzureInventorySnapshotMaterializer, AzureInventorySnapshotMaterializer>();
        services.AddScoped<IAuditFrameworkImportService, AuditFrameworkImportService>();
    }
}
