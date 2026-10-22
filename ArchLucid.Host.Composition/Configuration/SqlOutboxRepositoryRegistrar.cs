using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.IntegrationOutbox;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     SQL registrations for transactional outbox repositories (retrieval, export, projection, integration events).
/// </summary>
internal static class SqlOutboxRepositoryRegistrar
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<IRetrievalIndexingOutboxRepository, DapperRetrievalIndexingOutboxRepository>();
        services.AddScoped<IRunExportBlobPushOutboxRepository, DapperRunExportBlobPushOutboxRepository>();
        services.AddScoped<IPostCommitProjectionOutboxRepository, DapperPostCommitProjectionOutboxRepository>();
        services.AddScoped<IIntegrationEventOutboxRepository, DapperIntegrationEventOutboxRepository>();
    }
}
