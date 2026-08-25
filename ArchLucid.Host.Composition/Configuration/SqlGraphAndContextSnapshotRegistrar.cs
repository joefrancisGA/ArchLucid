using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     SQL registrations for context snapshots, graph snapshots, and Cosmos graph outbox persistence.
/// </summary>
internal static class SqlGraphAndContextSnapshotRegistrar
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<IContextSnapshotRepository, SqlContextSnapshotRepository>();
        services.AddScoped<SqlGraphSnapshotRepository>();
        services.AddScoped<IGraphSnapshotRepository, SqlGraphSnapshotRepository>();
        services.AddScoped<IGraphSnapshotSqlAuthorityWriter>(static sp => sp.GetRequiredService<SqlGraphSnapshotRepository>());
        services.AddScoped<ICosmosGraphSnapshotOutboxRepository, DapperCosmosGraphSnapshotOutboxRepository>();
    }
}
