using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Planning;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class SqlStorageProviderRegistrar
{
    private static void RegisterAdvisoryDraftOperations(IServiceCollection services)
    {
        services.AddSingleton<IAdvisoryDraftOperationRepository, DapperAdvisoryDraftOperationRepository>();
        services.AddSingleton<IAdvisoryDraftOperationStore, SqlAdvisoryDraftOperationStore>();
    }
}
