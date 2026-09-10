using ArchLucid.Application.Planning.AdvisoryDraft;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterAdvisoryDraftOperations(IServiceCollection services)
    {
        services.AddSingleton<IAdvisoryDraftOperationStore, InMemoryAdvisoryDraftOperationStore>();
    }
}
