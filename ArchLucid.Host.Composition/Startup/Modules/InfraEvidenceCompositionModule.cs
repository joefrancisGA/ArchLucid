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
        services.AddScoped<IAzureInventoryDiffService, AzureInventoryDiffService>();
        services.AddScoped<IAdvisoryTerraformRepresentationService, AdvisoryTerraformRepresentationService>();
        services.AddScoped<IAuditFrameworkImportService, AuditFrameworkImportService>();
        services.AddScoped<IAzureInventoryDiffConsumer, NoOpAzureInventoryDiffConsumer>();
    }
}
