using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class CoordinatorArtifactsCompositionModule
{
    private static void RegisterExplanation(IServiceCollection services, IConfiguration configuration)
    {
        RegisterCoordinatorAuthorityAndRepositories(services, configuration);
        RegisterExplanationServices(services, configuration);
    }
}
