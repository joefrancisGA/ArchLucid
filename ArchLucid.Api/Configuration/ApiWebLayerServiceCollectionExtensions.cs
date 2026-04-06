using ArchLucid.Api.Services;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Api.Services.Evolution;
using ArchLucid.Host.Core.Configuration;

namespace ArchLucid.Api.Configuration;

/// <summary>
/// HTTP/API-only DI registrations that depend on API-layer models (product learning read models, evolution simulation).
/// </summary>
/// <remarks>
/// The Worker host does not register these services; it does not expose Learning/Evolution controllers.
/// </remarks>
public static class ApiWebLayerServiceCollectionExtensions
{
    public static IServiceCollection AddArchLucidApiWebLayerServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArchLucidOptions options = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (string.Equals(options.StorageProvider, "InMemory", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<ILearningPlanningReadService, LearningPlanningReadService>();
            services.AddScoped<IEvolutionSimulationService, EvolutionSimulationService>();
        }
        else
        {
            services.AddScoped<ILearningPlanningReadService, LearningPlanningReadService>();
            services.AddScoped<IEvolutionSimulationService, EvolutionSimulationService>();
        }

        services.AddScoped<IAdminDiagnosticsService, AdminDiagnosticsService>();

        return services;
    }
}
