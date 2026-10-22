using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>Retrieval, embedding, vector index, and fine-tuning DI registrations.</summary>
public static partial class RetrievalCompositionModule
{
    /// <summary>Registers retrieval indexing, embedding, and fine-tuning services.</summary>
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        RegisterAgents(services, configuration);
        RegisterIndexing(services, configuration);
    }
}
