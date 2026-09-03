using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>Authority decision engine, repositories, and artifact synthesis DI registrations.</summary>
public static partial class CoordinatorArtifactsCompositionModule
{
    /// <summary>Registers coordinator repositories and artifact synthesis services.</summary>
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        RegisterExplanation(services, configuration);
        RegisterArtifacts(services);
    }
}
